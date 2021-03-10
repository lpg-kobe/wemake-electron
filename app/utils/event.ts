/**
 * @desc base controll of event
 */

import { EventEmitter } from 'events'

const EVENT = {
  serialport: {
    data: 'serialport:data',
    open: 'serialport:open',
    connected: 'serialport:connected'
  },
  gcode: {}
}

class WemakeEvent extends EventEmitter {
  public event: any

  constructor() {
    super()
    this.event = EVENT
  }
}

export default new WemakeEvent()