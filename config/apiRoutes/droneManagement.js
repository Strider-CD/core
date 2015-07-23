var Joi = require('joi')
var config = require('config')

module.exports = function () {
  var Drone = require('../../models/drone')
  return [{
    path: config.apiPrefix + 'drones',
    method: 'GET',
    handler: function (request, reply) {
      reply([
        'drone1'
      ])
    }
  }, {
    path: config.apiPrefix + 'drones',
    method: 'POST',
    config: {
      validate: {
        payload: {
          name: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {
      Drone.create(request.payload)
        .then(reply)
    }
  }, {
    path: config.apiPrefix + 'drones/{id}/checkin',
    method: 'PUT',
    handler: function (request, reply) {
      var id = request.params.id
      var payload = request.payload

      Drone.checkIn(id, payload)
        .then(reply)
    }
  }]
}
