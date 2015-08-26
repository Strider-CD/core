'use strict'

var Joi = require('joi')
var config = require('config')
var dronePath = config.apiPrefix + 'drones'

module.exports = function (emitter) {
  return [{
    path: dronePath,
    method: 'GET',
    handler: function (request, reply) {
      emitter.emit('drones.get', {}, function (err, list) {
        if (err) reply('').code(503) // Service Unavailable
        else reply(list)
      })
    }
  }, {
    path: dronePath,
    method: 'POST',
    config: {
      validate: {
        payload: {
          name: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {
      var drone = request.payload
      emitter.emit('drones.register', drone, function (err, list) {
        if (err) reply('').code(503) // Service Unavailable
        else reply(list)
      })
    }
  }, {
    path: `${dronePath}/{id}/checkin`,
    method: 'PUT',
    handler: function (request, reply) {
      var drone = request.payload
      drone.id = request.params.id

      emitter.emit('drones.checkIn', drone, function (err, id) {
        if (err) reply('').code(404) // update failed -> wrong id?
        else reply(id)
      })
    }
  }]
}
