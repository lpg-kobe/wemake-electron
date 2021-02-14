/**
 * @desc base connect of serialport
 */
const serialport = require('serialport')
type SerialportConfig = {
  port: string;
  baudRate: number
}
export default class WemakeSerialport {
  constructor(config: SerialportConfig) {
    const { port, ...params } = config
    this.serialport = new serialport(port, {
      ...params,
      baudRate: 115200
    })
  }
}
