
/**
 * @desc main logger during app during running,base on winston
 * @author pika
 */

const winston = require('winston')
const util = require('util')
const chalk = require('chalk')
const levels = winston.config.npm.levels

require('winston-daily-rotate-file')

const {
  format: { splat, colorize, printf, combine, label, timestamp },
  Transport,
  transports,
  createLogger
} = winston

const wemakeLog: any = createLogger({
  level: 'info',
  levels,
  exitOnError: false, // winston will not exit if handled exceptions
  format: combine(
    colorize(),
    label({ label: 'wemake' }),
    timestamp(),
    splat(),
    printf(({ message, level, label, timestamp }: any) => `${label}:${timestamp} ${level} ==== ${message}`)
  ),
  transports: [
    // log in console of chrome
    new transports.Console({
      level: 'error',
    }),

    // split file daily and save width limit size
    new transports.DailyRotateFile({
      filename: 'release/log/wemake-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
  // Handling Uncaught Exceptions with winston
  exceptionHandlers: [
    new transports.File({ filename: 'release/log/exceptions.log' })
  ]
})

// @ts-ignore custom transport
class ApiTransport extends Transport {
  constructor(opts: any) {
    console.log('add transport==============>', opts)
    super(opts)
  }

  log(info: any, callback: () => void) {
    // this will be happend once winston receive log
    console.log('info=======>>>>>>>', info)
    callback()
  }
}

const levelArray: Array<any> = Object.keys(levels)
const logFun: any = (namespace?: string) => levelArray.reduce((prev, level) => {
  prev[level] = (...args: any) => wemakeLog[level](`${chalk.cyan(namespace)} ### ${util.format(...args)}`)
  return prev
}, {})

export default logFun