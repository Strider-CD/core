var mongoose = require('mongoose')
var config = require('config')
var logger = require('../util/log')(module)

module.exports = function () {
  logger.info(`Mongoose trying to connect to ${config.mongoDbURI}`)
  mongoose.connect(config.mongoDbURI)

  mongoose.connection.on('connected', function () {
    logger.info(`Mongoose connection ${config.mongoDbURI}`)
  })

  mongoose.connection.on('error', function (err) {
    logger.info(`Mongoose connection error ${err}`)
  })

  mongoose.connection.on('disconnected', function () {
    logger.info('Mongoose connection disconnected')
  })

  process.on('SIGINT', function () {
    mongoose.connection.close(function () {
      logger.info('Mongoose connection disconnected due to SIGINT')
      process.exit(0)
    })
  })
}
