'use strict'

var Hapi = require('hapi')
var Primus = require('primus')
var config = require('config')
var logger = require('./lib/log.js')(module)
var apiRoutes = require('./lib/routes/api')
var server = new Hapi.Server()

server.connection({
  port: config.port
})

var primus = Primus(server.listener, {})

primus.on('connection', function (spark) {
  spark.write('ping')
  spark.on('data', function (data) {
    logger.info(data)
  })
})

server.route(apiRoutes())

if (!module.parent) {
  server.start(function (err) {
    if (err) {
      return console.error(err)
    }

    logger.info('Server started', server.info.uri)
  })
}

module.exports = server
