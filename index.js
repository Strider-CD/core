'use strict'

require('babel/register')({
  optional: ['es7.decorators', 'es7.objectRestSpread']
})

var Hapi = require('hapi')
var Primus = require('primus')
var config = require('config')
var EventEmitter = require('eventemitter3')
var logger = require('./lib/util/log')(module)
var routes = require('./lib/routes')
var eventHandlers = require('./lib/event-handlers')
var server = new Hapi.Server({
  connections: {
    routes: {
      cors: true
    }
  }
})
var Rooms = require('primus-rooms')

server.connection({
  port: config.port
})

var primus = Primus(server.listener, {})
primus.use('rooms', Rooms)
primus.on('connection', function (spark) {
  spark.write('ping')
  spark.on('data', function (data) {
    if (data.room) {
      if (data.save) {
        // save the buffered data into the database
        return
      }
      var room = data.room
      var message = data.msg

      // check if spark is already in this room
      if (~spark.rooms().indexOf(room)) {
        if (message && message.lineNumber && message.line) {
          console.log(message.lineNumber + ': ' + message.line)
          spark.room(room).write(message)
        }
      } else {
        if (data.action === 'leave') {
          spark.leave(room)
          return
        }
        // join the room
        spark.join(room, function () {
          if (message && message.lineNumber && message.line) {
            console.log(message.lineNumber + ': ' + message.line)
            spark.room(room).write(message)
          }
        })
      }
    }
  })
})

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
