import _ from 'lodash';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import noop from 'lodash/noop';
import semver from 'semver';
import SerialConnection from './serialport/SerialConnection';
import interpret from '../utils/math/interpret';
import Feeder from './ipc/Feeder';
import Sender, { SP_TYPE_SEND_RESPONSE } from './ipc/Sender';
import Workflow, {
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_RUNNING
} from './ipc/Workflow';
import { ensureRange } from '../utils/math/numeric-utils';
import ensureArray from '../utils/math/ensure-array';
import ensurePositiveNumber from '../utils/math/ensure-positive-number';
import evaluateExpression from '../utils/math/evaluateExpression';
import translateWithContext from '../utils/math/translateWithContext';
import serialport from 'serialport';
import Laser from './Laser';
import {
    LASER,
    WRITE_SOURCE_FEEDER,
    WRITE_SOURCE_SENDER,
    WRITE_SOURCE_QUERY,
    CONTROLLER_STATUS_INVALID, 
    CONTROLLER_STATUS_INSTALL_DRIVERING,    
    CONTROLLER_STATUS_INSTALL_DRIVER_ERROR, 
    CONTROLLER_STATUS_INSTALL_DRIVERED,     
    CONTROLLER_STATUS_CONNECTING,           
    CONTROLLER_STATUS_CONNECTED,            
    CONTROLLER_STATUS_CONNECT_TIME_OUT,     
} from './constants';
import logger from '../utils/log';
const log = logger('LaserController')

class LaserController {
    type = LASER;

    // SerialPort
    options = {
        port: '',
        baudRate: 115200
    };

    serialport = null;

    serialportListener = {
        data: (data) => {
            this.controller.parse(String(data));
        },
        close: (err) => {
            this.ready = false;
            if (err) {
                log.warn(`Disconnected from serial port "${this.options.port}":`, err);
            }
            this.close();
        },
        error: (err) => {
            this.ready = false;
            if (err) {
                log.error(`Unexpected error while reading/writing serial port "${this.options.port}":`, err);
            }
        }
    };

    allPorts = [];

    curPort = 0;

    curPortIndex = 0;

    lastOpenTime = 0;

    // Laser
    controller = null;

    ready = false;

    controller_status = CONTROLLER_STATUS_INVALID; 

    state = {};

    queryTimer = null;
    revDataTime = 0;

    showLogTimer = null;

    history = {
        // This write source is one of the following
        // * WRITE_SOURCE_CLIENT
        // * WRITE_SOURCE_FEEDER
        // * WRITE_SOURCE_SENDER
        // * WRITE_SOURCE_QUERY
        writeSource: null,
        writeLine: ''
    };

    // Event Trigger
    event = null;

    // Feeder
    feeder = null;

    // Sender
    sender = null;

    senderFinishTime = 0;

    // Workflow
    workflow = null;

    // start handler(timer)
    handler = null;

    query = {
        issue: () => {
            this.writeln('?');
        }
    };

    dataFilter = (line, context) => {
        // Current position
        const {
            x: posx,
            y: posy,
            z: posz,
            e: pose
        } = this.controller.getPosition();
        // modal
        const modal = this.controller.getModal();

        // The context contains the bounding box and current position
        Object.assign(context || {}, {
            // modal
            modal: {
                motion: modal.motion,
                units: modal.units,
                distance: modal.distance,
                feedrate: modal.feedrate,
                spindle: modal.spindle
            },
            // Bounding box
            xmin: Number(context.xmin) || 0,
            xmax: Number(context.xmax) || 0,
            ymin: Number(context.ymin) || 0,
            ymax: Number(context.ymax) || 0,
            zmin: Number(context.zmin) || 0,
            zmax: Number(context.zmax) || 0,
            // Current position
            posx: Number(posx) || 0,
            posy: Number(posy) || 0,
            posz: Number(posz) || 0,
            pose: Number(pose) || 0
        });

        // Evaluate expression
        if (line[0] === '%') {
            // line="%_x=posx,_y=posy,_z=posz"
            evaluateExpression(line.slice(1), context);
            return '';
        }

        // line="G0 X[posx - 8] Y[ymax]"
        // > "G0 X2 Y50"
        return translateWithContext(line, context);
    };

    constructor() {
        // Feeder,queue to controll events like feed & next.. 
        this.feeder = new Feeder({
            dataFilter: (line, context) => {
                return this.dataFilter(line, context);
            }
        });
        // this will happend and run dataFilter once you call this.feeder.next()
        this.feeder.on('data', (line = '', context = {}) => {
            if (!this.isOpen()) {
                log.error(`Serial port "${this.options.port}" is not accessible`);
                return;
            }

            line = String(line).trim();
            if (line.length === 0) {
                return;
            }

            //this.emitAll('serialport:write', line, context);
            this.writeln(line, {
                source: WRITE_SOURCE_FEEDER // set write source to record history of serial, witch contain write source & write line like 'G0 XX YY'
            });
            log.silly(`> ${line}`);
        });

        // Sender ,init to load gcode and emit data to this 
        this.sender = new Sender(SP_TYPE_SEND_RESPONSE, {
            dataFilter: (line, context) => {
                return this.dataFilter(line, context);
            }
        });
        this.sender.on('data', (line = '') => {
            if (!this.ready) {
                log.error(`Serial port "${this.options.port}" is not accessible`);
                return;
            }

            if (this.workflow.state !== WORKFLOW_STATE_RUNNING) {
                log.error(`Unexpected workflow state: ${this.workflow.state}`);
                return;
            }

            line = String(line).trim();
            if (line.length === 0) {
                log.warn(`Expected non-empty line: N=${this.sender.state.sent}`);
                return;
            }

            this.writeln(line, {
                source: WRITE_SOURCE_SENDER
            });
            log.silly(`> ${line}`);
        });
        this.sender.on('hold', noop);
        this.sender.on('unhold', noop);
        this.sender.on('start', () => {
            this.senderFinishTime = 0;
        });
        this.sender.on('end', (finishTime) => {
            this.senderFinishTime = finishTime;

            // Received all response, manually call stop
            this.command(null, 'gcode:stop');
        });

        // Workflow
        this.workflow = new Workflow();
        this.workflow.on('start', () => {
            this.sender.rewind();
        });
        this.workflow.on('stop', () => {
            this.sender.rewind();
        });
        /*
        this.workflow.on('pause', () => {
            this.emitAll('workflow:state', this.workflow.state);
        });
        */
        this.workflow.on('resume', () => { 
            //this.emitAll('workflow:state', this.workflow.state);
            this.sender.next(); // calculate time width handle gcode after restart workflow
        });

        this.controller = new Laser();

        this.controller.on('data', (res) => {
            if (!this.isOpen()){
                log.error(`port is closed, try to connect...`);
                return;
            }
            if (!this.ready){
                this.ready = true;
            }
            if (CONTROLLER_STATUS_CONNECTED !== this.controller_status){
                this.controller_status = CONTROLLER_STATUS_CONNECTED;
                log.info('connect status: connecting -> connected.');
            }
            this.revDataTime =  new Date().getTime(); 
        });

        this.controller.on('pos', (res) => {// get position from serialport:read to make sure mechine is ready
            log.silly(`controller.on('pos'): source=${this.history.writeSource}, line=${JSON.stringify(this.history.writeLine)}, res=${JSON.stringify(res)}`);
            if (_.includes([WRITE_SOURCE_CLIENT, WRITE_SOURCE_FEEDER], this.history.writeSource)) {
                this.emitAll('serialport:read', res.raw);
            }
        });
        this.controller.on('ok', (res) => {
            log.silly(`controller.on('ok'): source=${this.history.writeSource}, line=${JSON.stringify(this.history.writeLine)}, res=${JSON.stringify(res)}`);
            // Display info to console, if this is from user-input
            if (res) {
                if (!this.history.writeSource) {
                    //this.emitAll('serialport:read', res.raw);
                    log.error('"history.writeSource" should NOT be empty');
                }
            }

            // FIXME: writeSource should not set to null when sending multiple queries at once while not receive all 'ok'
            this.history.writeSource = null;
            this.history.writeLine = null;

            // Sender
            if (this.workflow.state === WORKFLOW_STATE_RUNNING) {
                // Check hold state
                if (this.sender.state.hold) {
                    const { sent, received } = this.sender.state;
                    if (received + 1 >= sent) {
                        log.debug(`Continue sending G-code: sent=${sent}, received=${received}`);
                        this.sender.unhold();
                    }
                }
                this.sender.ack();
                this.sender.next();
                return;
            }
            if (this.workflow.state === WORKFLOW_STATE_PAUSED) {
                const { sent, received } = this.sender.state;
                if (sent > received) {
                    this.sender.ack();
                    return;
                }
            }

            // Feeder
            if (this.feeder.next()) {
                return;
            }
        });
        
        /*
        this.controller.on('echo', (res) => {
            this.emitAll('serialport:read', res.raw);
        });
        */

        this.controller.on('error', (res) => {
            // Sender
            if (this.workflow.state === WORKFLOW_STATE_RUNNING) {
                const { lines, received } = this.sender.state;
                const line = lines[received] || '';

                this.sender.ack();
                this.sender.next();
                return;
            }

            // Feeder
            this.feeder.next();
        });

        this.controller.on('others', (res) => {
            log.error('Can\'t parse result, maybe correct.', res.raw);
            if (this.workflow.state === WORKFLOW_STATE_RUNNING) {
                const { lines, received } = this.sender.state;
                const line = lines[received] || '';

                this.sender.ack();
                this.sender.next();
                return;
            }

            this.feeder.next();
        });

        this.queryTimer = setInterval(() => {
            const now = new Date().getTime();
            // Feeder
            /*
            if (this.feeder.peek()) {
                this.emitAll('feeder:status', this.feeder.toJSON());
            }
            */

            // Sender
            /*
            if (this.sender.peek()) {
                this.emitAll('sender:status', this.sender.toJSON());
            }
            */

            const zeroOffset = isEqual(
                this.controller.getPosition(this.state),
                this.controller.getPosition(this.controller.state)
            );

            // Laser state
            if (this.state !== this.controller.state) {
                this.state = this.controller.state;
                //this.emitAll('Laser:state', this.state);
            }

            this.query.issue();            
            if (now - this.revDataTime > 500 && CONTROLLER_STATUS_CONNECTING !== this.controller_status){// milliseconds
                this.controller_status = CONTROLLER_STATUS_INVALID; 
            }
            this.tryToChangeStatus(now);
            // emit ui

            // Wait for the bootloader to complete before sending commands
            if (!(this.ready)) {
                return;
            }

            // Check if the machine has stopped movement after completion,it will be 0 if gcode hased ended width sender
            if (this.senderFinishTime > 0) {// sending gcode
                const machineIdle = zeroOffset;
                const timespan = Math.abs(now - this.senderFinishTime);
                const toleranceTime = 500; // in milliseconds

                if (!machineIdle) {
                    // Extend the sender finish time
                    this.senderFinishTime = now;
                } else if (timespan > toleranceTime) {
                    log.silly(`Finished sending G-code: timespan=${timespan}`);

                    this.senderFinishTime = 0;

                    // Stop workflow
                    this.command(null, 'gcode:stop');
                }
            }
        }, 250);
    this.showLogTimer = setInterval(() => {
            log.info('connect status:', this.controller_status, ', ready:', this.ready);
        }, 60000);
    }

    destroy() {
        if (this.serialport) {
            this.serialport = null;
        }

        if (this.event) {
            this.event = null;
        }

        if (this.feeder) {
            this.feeder = null;
        }

        if (this.sender) {
            this.sender = null;
        }

        if (this.workflow) {
            this.workflow = null;
        }

        if (this.queryTimer) {
            clearInterval(this.queryTimer);
            this.queryTimer = null;
        }
    
        if (this.showLogTimer) {
            clearInterval(showLogTimer);
            this.showLogTimer = null;
        }

        if (this.controller) {
            this.controller.removeAllListeners();
            this.controller = null;
        }
    }

    get status() {
        return {
            port: this.options.port,
            baudrate: this.options.baudRate,
            ready: this.ready,
            controller: {
                type: this.type,
                state: this.state,
            },
            workflowState: this.workflow.state,
            feeder: this.feeder.toJSON(),
            sender: this.sender.toJSON()
        };
    }

    /** open a new serialport after inited LaserController */
    open(port, callback = noop) {
        //const { port } = this.options;
        //const { baudRate } = { ...options };
        this.options = {
            ...this.options,
            port: port
        };

        // Assertion check
        if (this.serialport && this.serialport.isOpen()) {
            log.error(`Cannot open serial port "${port}"`);
            return;
        }

        this.serialport = new SerialConnection({
            ...this.options,
            writeFilter: (data, context) => {
                const { source = null } = { ...context };
                const line = data.trim();

                // update write history
                this.history.writeSource = source;
                this.history.writeLine = line;

                if (!line) {
                    return data;
                }

                let { jogSpeed, workSpeed, headStatus, headPower } = { ...this.controller.state };
                const modal = { ...this.controller.state.modal };
                let spindle = 0;

                interpret(line, (cmd, params) => {
                    // motion
                    // if (_.includes(['G0', 'G1', 'G2', 'G3', 'G38.2', 'G38.3', 'G38.4', 'G38.5', 'G80'], cmd)) {
                    if (_.includes(['G0', 'G1'], cmd)) {
                        modal.motion = cmd;
                    }

                    // units
                    if (_.includes(['G20', 'G21'], cmd)) {
                        // G20: Inches, G21: Millimeters
                        modal.units = cmd;
                    }

                    // distance
                    if (_.includes(['G90', 'G91'], cmd)) {
                        // G90: Absolute, G91: Relative
                        modal.distance = cmd;
                    }

                    // feedrate mode
                    if (_.includes(['G93', 'G94'], cmd)) {
                        // G93: Inverse time mode, G94: Units per minute
                        modal.feedrate = cmd;
                    }

                    // spindle or head
                    if (_.includes(['M3', 'M4', 'M5'], cmd)) {
                        // M3: Spindle on, M4: Spindle (ccw), M5: Spindle off
                        modal.spindle = cmd;

                        if (cmd === 'M3' || cmd === 'M4') {
                            if (params.S !== undefined) {
                                spindle = params.S;
                            }
                        }
                    }

                    if (cmd === 'G0' && params.F) {
                        jogSpeed = params.F;
                    }
                    if (cmd === 'G1' && params.F) {
                        workSpeed = params.F;
                    }

                    if (cmd === 'M3') {
                        headStatus = 'on';
                        if (params.P !== undefined) {
                            headPower = params.P;
                            headPower = ensureRange(headPower, 0, 100);
                        } else if (params.S !== undefined) {
                            // round to get executed power, convert to percentage and round again
                            headPower = Math.round(params.S) / 7200.0 * 100.0;
                            headPower = ensureRange(headPower, 0, 100);
                        }
                    }
                    if (cmd === 'M5') {
                        headStatus = 'off';
                        headPower = 0;
                    }
                });

                const nextState = {
                    ...this.controller.state,
                    modal,
                    spindle,
                    jogSpeed,
                    workSpeed,
                    headStatus,
                    headPower
                };

                if (!isEqual(this.controller.state, nextState)) {
                    this.controller.state = nextState; // enforce change
                }

                return data;
            }
        });

        this.serialport.on('close', this.serialportListener.close);
        this.serialport.on('error', this.serialportListener.error);
        this.serialport.on('data', this.serialportListener.data);
        this.serialport.open((err) => {
            if (err || !this.serialport.isOpen) {
                log.error(`Error opening serial port "${port}":`, err);
                //this.emitAll('serialport:open', { port: port, err: err });
                callback(err); // notify error
                return;
            }

            //this.emitAll('serialport:open', { port: port });

            callback(); // register controller

            // Make sure machine is ready.
            this.handler = setInterval(() => {
                // Set ready flag to true when receiving a start message
                if (this.handler && this.ready) {
                    clearInterval(this.handler);
                    return;
                }

                // send ? to get position 
                setTimeout(() => this.writeln('?'));
            }, 1000);

            log.debug(`Connected to serial port "${port}"`);

            this.workflow.stop();

            // Clear action values，set 0 to end
            this.senderFinishTime = 0;

            if (this.sender.state.gcode) {
                // Unload G-code
                this.command(null, 'unload');
            }
        });
    }

    close() {
        const { port } = this.options;

        if (this.handler) {
            clearInterval(this.handler);
        }

        // Assertion check
        if (!this.serialport) {
            log.error(`Serial port "${port}" is not available`);
            return;
        }

        // Stop status query
        this.ready = false;

        //this.emitAll('serialport:close', { port: port });

        if (this.isOpen()) {
            this.serialport.removeListener('close', this.serialportListener.close);
            this.serialport.removeListener('error', this.serialportListener.error);
            this.serialport.close((err) => {
                if (err) {
                    log.error(`Error closing serial port "${port}":`, err);
                }
            });
        }

        //this.destroy();
    }

    isOpen() {
        return this.serialport && this.serialport.isOpen;
    }
    
    listPort(){
        serialport.list().then((ports, err) => {
            if (err){
                return;
            }
            this.allPorts = ports;
        }
        /*
        serialport.list((err, ports) => {
            if (err) {
                // log.error(`fetch port fail: "${err}"`);
                return;
            }
            const availablePorts = ports.map(port => {
                return {
                    port: port.comName,
                    manuFacturer: port.manuFacture
                };
            });
            this.allPorts = availablePorts;
        });
        */
        );}

    autoConnect(){
        if (this.curPortIndex >= this.allPorts.length){
            this.listPort();
            this.curPortIndex = 0;
        }
        //this.open(this.allPorts[this.curPortIndex]);
        if (0 !== this.allPorts.length){
            this.open(this.allPorts[this.curPortIndex].path);
            this.curPortIndex ++;
        }
    }
    
    resetConnect(){
        if (null !== this.serialport){
            this.serialport = null; 
        }
        this.ready = false;
    }

    tryToChangeStatus(now){
        if (now - this.lastOpenTime <= 500)
        {
            return;
        }
        this.lastOpenTime = now;

        if (CONTROLLER_STATUS_INVALID === this.controller_status) {
            this.controller_status = CONTROLLER_STATUS_CONNECTING;
        }else if (CONTROLLER_STATUS_CONNECTING === this.controller_status && true === this.ready){
            log.info('connect status: connecting -> connected.');
            this.controller_status = CONTROLLER_STATUS_CONNECTED;
            return;
        }
        if (CONTROLLER_STATUS_CONNECTING === this.controller_status) {
            this.resetConnect();
            this.autoConnect();
        }
    }

    command(socket, cmd, ...args) {
        const handler = {
            'gcode:load': () => {
                const [name, originalGcode, callback = noop] = args;

                const dwell = 'G4P0.5; Wait for the planner queue to empty';
                const gcode = `${originalGcode}\n${dwell}`;

                const ok = this.sender.load(name, gcode);
                if (!ok) {
                    callback(new Error(`Invalid G-code: name=${name}`));
                    return;
                }


                log.debug(`Load G-code: name="${this.sender.state.name}", size=${this.sender.state.gcode.length}, total=${this.sender.state.total}`);

                this.workflow.stop();

                callback(null, { name, gcode });
            },
            'gcode:unload': () => {
                this.workflow.stop();

                // Sender
                this.sender.unload();

            },
            'gcode:start': () => {
                this.workflow.start();

                // Feeder
                this.feeder.clear();

                // Sender
                this.sender.next();
            },
            'gcode:resume': () => {
                this.workflow.resume();
            },
            'gcode:pause': () => {
                this.workflow.pause();
            },
            'gcode:stop': () => {
                this.workflow.stop();
            },
            'feedhold': () => {
                this.workflow.pause();
            },
            'cyclestart': () => {
                this.workflow.resume();
            },
            'statusreport': () => {
                this.writeln('?', { emit: false });
            },
            'homing': () => {
                this.writeln('G28.2 X Y Z', { emit: false });
            },
            'reset': () => {
                this.workflow.stop();

                // Feeder
                this.feeder.clear();

            },

            'gcode': () => {
                const [commands, context] = args;
                const data = ensureArray(commands)
                    .join('\n')
                    .split('\n')
                    .filter(line => {
                        if (typeof line !== 'string') {
                            return false;
                        }

                        return line.trim().length > 0;
                    });

                this.feeder.feed(data, context);

                { // The following criteria must be met to trigger the feeder
                    const notBusy = !(this.history.writeSource);
                    const senderIdle = (this.sender.state.sent === this.sender.state.received);
                    const feederIdle = !(this.feeder.isPending());
                    if (notBusy && senderIdle && feederIdle) {
                        this.feeder.next();
                    }
                }
                // No executing command && sender is not sending.
                if (!this.lastCmdType && this.sender.size() === 0 && !this.feeder.isPending()) {
                    this.feeder.next();
                }
            }
        }[cmd];

        if (!handler) {
            log.error(`Unknown command: ${cmd}`);
            return;
        }

        handler();
    }

    writeln(data, context = {}) {
        if (!this.isOpen()) {
            log.error(`Serial port "${this.options.port}" is not accessible`);
            return;
        }

        if (!data.endsWith('\n')) {
            data += '\n';
        }

        context = context || {};
        // `WRITE_SOURCE_QUERY` is considered triggered by code and should be quiet
        context.source = context.source || WRITE_SOURCE_QUERY;

        this.serialport.write(data, context);
    }
}

export default LaserController;
