/**
 * @desc tools during webpack
 * @author pika
 */
const fs = require('fs')
const path = require('path')

module.exports = {
  // read .env namspace file to json
  readFile2Json (filePath) {
    const envKey = {}
    const defineKey = {}
    let file = fs.readFileSync(filePath, {
      encoding: 'utf-8'
    })
    file = file.replace(/\n/g, ',').replace(/\r/g, '')
    // 过滤#开头的备注并生成配置
    file
      .split(',')
      .filter(line => !line.startsWith('#'))
      .map(item => {
        const key = item.split('=')[0]
        const value = item.split('=')[1]
        envKey[key] = value
      })
    Object.entries(envKey).forEach(([key, value]) => {
      defineKey[`process.env.${key}`] = value
    })
    return {
      envKey,
      defineKey
    }
  }
}
