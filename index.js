'use strict'

var Hapi = require('hapi')
var Primus = require('primus')
// var Joi = require('joi')
var config = require('config')
var server = new Hapi.Server()

server.connection({
  port: config.port
})

var primus = Primus(server.listener, {})

primus.on('connection', function (spark) {
  spark.write('ping')
  spark.on('data', function (data) {
    console.log(data)
  })
})

// Testing onPostAuth for protobuf transformation
// we can remove this and hadle that after the fact.
server.ext('onPostAuth', function (request, reply) {
  var payload = request.payload

  if (payload) {
    payload.onPostAuth = true
    reply(payload)
  }

  reply.continue()
})

server.route([
  {
    path: '/api/drones',
    method: 'GET',
    handler (request, reply) {
      reply([
        'drone1'
      ])
    }
  }, {
    path: '/api/drones/{id}/checkin',
    method: 'PUT',
    handler (request, reply) {
      var id = request.params.id
      var payload = request.payload

      payload.droneId = id

      reply(payload)
    }
  }
])

if (!module.parent) {
  server.start(function (err) {
    if (err) {
      return console.error(err)
    }

    console.log('Server started', server.info.uri)
  })
}

module.exports = server
