'use strict'

require('babel/register')({
  optional: ['es7.decorators', 'es7.objectRestSpread']
})

var Hapi = require('hapi')
var Primus = require('primus')
var config = require('config')
var EventEmitter = require('eventemitter3')
var logger = require('./lib/log')(module)
var apiRoutes = require('./lib/routes/api')
var eventHandlers = require('./lib/event-handlers')
var server = new Hapi.Server()

server.connection({
  port: config.port
})

var emitter = new EventEmitter()
eventHandlers(emitter)

var primus = Primus(server.listener, {})
primus.on('connection', function (spark) {
  spark.write('ping')
  spark.on('data', function (data) {
    logger.info(data)
  })
})

// Super simple logging
// TODO: add something more inteligent, maybe using `good` module
server.on('response', function (request) {
  console.log(`${request.info.remoteAddress}: ${request.method.toUpperCase()} ${request.url.path} --> ${request.response.statusCode}`)
})

server.route(apiRoutes(emitter))

if (!module.parent) {
  server.start(function (err) {
    if (err) {
      return console.error(err)
    }

    logger.info('Server started', server.info.uri)
  })
}

module.exports = server
