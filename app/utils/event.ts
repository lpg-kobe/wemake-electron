/**
 * @desc base controll of event
 */

import { EventEmitter } from 'events'

// global event during appp run
export const EVENT = {
  serialport: {
    data: 'serialport:data',
    open: 'serialport:open',
    connected: 'serialport:connected'
  },
  gcode: {
    data: 'gcode:data',
    split: 'gcode:split',
  },
  // socket event of server
  server: {

  },
  // socket event of client
  client: {

  }
}

class WemakeEvent extends EventEmitter {
  public event: any

  constructor() {
    super()
    this.event = EVENT
  }
}

export default new WemakeEvent()