/**
 * @desc server base express
 * @author pika
 */

import express from 'express'
import SocketIo from './socket'
import { EVENT } from '../../app/utils/event'

const app = express()
const io = new SocketIo({ port: 8024, server: app })

// split gcode demo
app.get('/gcode/split', (req, res) => {
  const result = { data: 'GCode:G28 G0' }
  setTimeout(() => {
    const { gcode: { data } } = EVENT
    io.wsInstance.client.emit(data, { data: result })
    res.send(result)
  }, 1000)
})