'use strict'

var Hapi = require('hapi')
// var Joi = require('joi')
var config = require('config')
var server = new Hapi.Server()

server.connection({
  port: config.port
})

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
