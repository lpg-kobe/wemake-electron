/**
 * @desc base controll of serialport
 */
const serialport = require('serialport')
export default class WemakeSerialport{
  constructor{
    this.serialport = serialport
  }
}