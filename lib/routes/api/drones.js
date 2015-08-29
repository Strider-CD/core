'use strict'

var config = require('config')
var Drone = require('../../models/drone')
var dronePath = config.apiPrefix + 'drones'

module.exports = function () {
  return [{
    path: dronePath,
    method: 'GET',
    handler (request, reply) {
      Drone.findByQuery({}).then(function (list) {
        reply(list)
      }).catch(function (err) {
        reply(err).code(503)
      })
    }
  }, {
    path: dronePath,
    method: 'POST',
    handler (request, reply) {
      var drone = request.payload

      Drone.save(drone).then(function (id) {
        reply(id)
      }).catch(function (error) {
        reply(error).code(503)
      })
    }
  }, {
    path: `${dronePath}/{id}/checkin`,
    method: 'PUT',
    handler (request, reply) {
      var drone = request.payload
      drone.id = request.params.id

      if (typeof drone.id !== 'string') {
        return reply('invalid drone').code(400)
      }

      Drone.update(drone.id, drone).then(function (id) {
        reply({ id, status: 'ready', onPostAuth: true })
      }).catch(function (err) {
        reply(err).code(404)
      })
    }
  }]
}
