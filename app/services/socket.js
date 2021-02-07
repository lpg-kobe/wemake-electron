/**
 * @desc base controll of socket
 */

const WemakeSerialport = require('./serilport')
export default class WemakeSocket{
  constructor{
    this.socket = {}
    this.serialport = new WemakeSerialport()
  }
}