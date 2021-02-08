/**
 * @desc base controll of socket @TODO
 */

const SocketIo = require('socket.io')
export default class WemakeSocket {
  constructor() {
    this.socket = SocketIo()
  }
}