/**
 * @desc server base express
 * @author pika
 */

import express from 'express'
import SocketIo from './socket'
import { EVENT } from '../../app/utils/event'

const app = express()
const io = new SocketIo({ port: 8024, server: app })

app.get('/gcode/split', (req, res) => {
  setTimeout(() => {
    const { gcode: { data } } = EVENT
    io.wsInstance.client.emit(data)
  }, 1000)
  res.send({ data: 'GCode:G28 G0' })
})