/**
 * all tools during LaserController running
 */
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import set from 'lodash/set';
import events from 'events';
import semver from 'semver';
import { HEAD_TYPE_3DP, HEAD_TYPE_LASER, HEAD_TYPE_CNC } from './constants';
import logger from '../utils/log';
const log = logger('Laser');

// http://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
function decimalPlaces(num) {
    const match = (String(num)).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) {
        return 0;
    }
    return Math.max(
        0,
        // Number of digits right of decimal point.
        (match[1] ? match[1].length : 0)
        // Adjust for scientific notation.
        - (match[2] ? +match[2] : 0)
    );
}


class LaserLineParserResultStart {
    // start
    static parse(line) {
        const r = line.match(/^start$/);
        if (!r) {
            return null;
        }

        const payload = {};

        return {
            type: LaserLineParserResultStart,
            payload: payload
        };
    }
}


class LaserLineParserResultPosition {
    // <Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>  
    static parse(line) {
        const r = line.match(/^\<Alarm/i);
        if (!r) {
            return null;
        }

        const payload = {
            pos: {}
        };
        const pattern = /WPos:(.+)/;
        const params = line.match(pattern);
        if(!params){
            return null;
        }
        const xyz = params[1].replace(/\>$/,'')
        const posArr = xyz.split(',')
        const digitsX = decimalPlaces(posArr[0]);
        const digitsY = decimalPlaces(posArr[1]);
        const digitsZ = decimalPlaces(posArr[2]);
        payload.pos['x'] = Number(posArr[0]).toFixed(digitsX)
        payload.pos['y'] = Number(posArr[1]).toFixed(digitsY)
        payload.pos['z'] = Number(posArr[2]).toFixed(digitsZ)

        return {
            type: LaserLineParserResultPosition,
            payload: payload
        };
    }
}

class LaserLineParserResultOk {
    // ok
    static parse(line) {
        const r = line.match(/^ok$/);
        if (!r) {
            return null;
        }

        const payload = {};

        return {
            type: LaserLineParserResultOk,
            payload: payload
        };
    }
}

class LaserLineParserResultEcho {
    // echo:
    static parse(line) {
        const r = line.match(/^echo:\s*(.+)$/i);
        if (!r) {
            return null;
        }

        const payload = {
            message: r[1]
        };

        return {
            type: LaserLineParserResultEcho,
            payload: payload
        };
    }
}

class LaserLineParserResultError {
    // Error:Printer halted. kill() called!
    static parse(line) {
        const r = line.match(/^Error:\s*(.+)$/i);
        if (!r) {
            return null;
        }

        const payload = {
            message: r[1]
        };

        return {
            type: LaserLineParserResultError,
            payload: payload
        };
    }
}


class LaserLineParser {
    parse(line) {
        const parsers = [
            // ok
            LaserLineParserResultOk,

            // start
            LaserLineParserResultStart,

            // X:0.00 Y:0.00 Z:0.00 E:0.00 Count X:0 Y:0 Z:0
            LaserLineParserResultPosition,

            // echo:
            LaserLineParserResultEcho,

            // Error:Printer halted. kill() called!
            LaserLineParserResultError,
        ];

        for (const parser of parsers) {
            const result = parser.parse(line);
            if (result) {
                set(result, 'payload.raw', line);
                return result;
            }
        }

        return {
            type: null,
            payload: {
                raw: line
            }
        };
    }
}

class Laser extends events.EventEmitter {
    state = {
        // firmware version
        version: '1.0.0',
        // tool head type
        headType: '',
        pos: {
            x: '0.000',
            y: '0.000',
            z: '0.000',
            e: '0.000'
        },
        modal: {
            motion: 'G0', // G0, G1, G2, G3, G38.2, G38.3, G38.4, G38.5, G80
            units: 'G21', // G20: Inches, G21: Millimeters
            distance: 'G90', // G90: Absolute, G91: Relative
            feedrate: 'G94', // G93: Inverse time mode, G94: Units per minute
            spindle: 'M5' // M3: Spindle (cw), M4: Spindle (ccw), M5: Spindle off
        },
        spindle: 0, // Related to M3, M4, M5
        jogSpeed: 0, // G0
        workSpeed: 0, // G1
        headStatus: 'off', //激光头是否打开
        // Head Power (in percentage, an integer between 0~100)
        headPower: 100
    };

    settings = {
        // whether enclosure is turned on
        enclosure: false
    };

    // main parser to parse result code of serialport
    parser = new LaserLineParser();

    setState(state) {
        const nextState = { ...this.state, ...state };

        if (!isEqual(this.state, nextState)) {
            this.state = nextState;
        }
    }

    set(settings) {
        const nextSettings = { ...this.settings, ...settings };

        if (!isEqual(this.settings, nextSettings)) {
            this.settings = nextSettings;
        }
    }

    // parse data callback from serialport
    parse(data) {
        data = (String(data)).replace(/\s+$/, '');
        if (!data) {
            return;
        }

        this.emit('raw', { raw: data });

        const now1 = new Date().getTime();
        const result = this.parser.parse(data) || {};
        const { type, payload } = result;

        this.emit('data', payload);
        if (type === LaserLineParserResultStart) {
            this.emit('start', payload);
        } else if (type === LaserLineParserResultPosition) {
            const nextState = {
                ...this.state,
                pos: {
                    ...this.state.pos,
                    ...payload.pos
                }
            };

            if (!isEqual(this.state.pos, nextState.pos)) {
                this.state = nextState; // enforce change
            }
            this.emit('pos', payload);
        } else if (type === LaserLineParserResultOk) {
            this.emit('ok', payload);
        } else if (type === LaserLineParserResultError) {
            this.emit('error', payload);
        } else if (type === LaserLineParserResultEcho) {
            this.emit('echo', payload);
        } else if (data.length > 0) {
            this.emit('others', payload);
        }
        const now2 = new Date().getTime();
    }

    getPosition(state = this.state) {
        return get(state, 'pos', {});
    }

    getModal(state = this.state) {
        return get(state, 'modal', {});
    }
}

export {
    LaserLineParser,
    LaserLineParserResultStart,
    LaserLineParserResultPosition,
    LaserLineParserResultOk,
    LaserLineParserResultEcho,
    LaserLineParserResultError,
};
export default Laser;
