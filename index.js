'use strict'

require('babel/register')({
  optional: ['es7.decorators', 'es7.objectRestSpread']
})

var Hapi = require('hapi')
var config = require('config')
var EventEmitter = require('eventemitter3')
var logger = require('./lib/util/log')(module)
var routes = require('./lib/routes')
var eventHandlers = require('./lib/event-handlers')
var PrimusHandler = require('./lib/primus-handlers')
var server = new Hapi.Server({
  connections: {
    routes: {
      cors: true
    }
  }
})

server.connection({
  port: config.port
})

var primus = new PrimusHandler(server)
server.primus = primus

var emitter = new EventEmitter()
eventHandlers(emitter, primus)

// Super simple logging
// TODO: add something more inteligent, maybe using `good` module
server.on('response', function (request) {
  console.log(request.info.remoteAddress + ' : ' + request.method.toUpperCase() + ' ' + request.url.path + ' --> ' + request.response.statusCode)
})

server.route(routes(emitter))

if (!module.parent) {
  server.start(function (err) {
    if (err) {
      return console.error(err)
    }

    logger.info('Server started', server.info.uri)
  })
}

module.exports = server
