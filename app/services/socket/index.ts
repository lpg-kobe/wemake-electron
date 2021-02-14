/**
 * @desc base controll of socket @TODO
 */

const SocketIo = require('socket.io')

module.exports = class WemakeSocket {
  constructor(server) {
    this.socket = SocketIo(server)
    this._bindEvent(this.socket)
  }

  _bindEvent(socket) {
    socket.on('connection', () => {
      console.log('success to connect ....')
    })
  }
}