/**
 * @desc logger during app run
 * @author pika
 */
const winston = require('winston')
const { format: { combine, colorize, timestamp, printf } } = winston
const wemakeLogger = winston.createLogger({
  exitOnError: false,
  level: 'info',
  silent: false,
  transports: [
    new winston.transports.File({ filename: 'wemake.log' }),
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        printf((log: any) => `${log.timestamp} - ${log.level} ${log.message}`)
      ),
      handleExceptions: true
    })
  ]
});

export default wemakeLogger