'use strict'

var Hapi = require('hapi')
var Primus = require('primus')
var Joi = require('joi')
var config = require('config')
var Drone = require('./models/drone')
var server = new Hapi.Server()
var basePath = '/api/v' + config.apiVersion + '/'

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

server.route([
  {
    path: basePath + 'drones',
    method: 'GET',
    handler (request, reply) {
      reply([
        'drone1'
      ])
    }
  }, {
    path: basePath + 'drones',
    method: 'POST',
    config: {
      validate: {
        payload: {
          name: Joi.string().required()
        }
      }
    },
    handler (request, reply) {
      Drone.create(request.payload)
        .then(reply)
    }
  }, {
    path: basePath + 'drones/{id}/checkin',
    method: 'PUT',
    handler (request, reply) {
      var id = request.params.id
      var payload = request.payload

      Drone.checkIn(id, payload)
        .then(reply)
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
