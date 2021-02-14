/**
 * @desc base connect of serialport
 */
const Serialport = require('serialport')
type SerialportConfig = {
  port: string;
  baudRate: number
}
export default class WemakeSerialport {
  private serialport

  constructor(config: SerialportConfig) {
    const { port, ...params } = config
    this.serialport = new Serialport(port, {
      ...params,
      baudRate: 115200
    })
    this._bindEvent(this.serialport)
  }

  _bindEvent(serialport: Serialport) {
    Serialport.on('data', () => { })
  }
}
