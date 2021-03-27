/**
 * @desc socket server during app run, contain socket.io for server & socket.io-client for client
 * @author pika
 */

import io from 'socket.io'
import http from 'http'
import logger from '../../app/utils/log'
import { EVENT } from '../../app/utils/event'

const wemakeLog = logger('______Sokcet Server______')

class SocketIo {
  constructor(config) {
    this.wsInstance = { config }
    this.initServer(config)
  }

  static emit(eventName, ...args) {
    const { client } = this.wsInstance
    client.emit.apply(client, eventName, ...args)
  }

  initServer(config) {
    const { server, port } = config
    const httpServer = http.Server(server)
    this.server = io(httpServer)
    httpServer.listen(port, () => {
      wemakeLog.info(`success to start socket server on port:${port}`)
    })
    this.wsInstance = { ...this.wsInstance, server: this.server }
    this.bindServerEvent()
  }

  bindServerEvent() {
    const { gcode: { split } } = EVENT
    const { config: { port } } = this.wsInstance
    this.server.on('connect', (socket) => {
      wemakeLog.info('sone success to connect socket server:')
      this.wsInstance = { ...this.wsInstance, client: socket }
      socket.on(split, (params) => {
        wemakeLog.info('receive gcode split request from client:', params)
      })
    })
  }

  bindClientEvent() {
    this.client.on('connect', () => {
      wemakeLog.info('success to connect socket by client:')
    })
  }
}

export default SocketIo
