var Joi = require('joi')
var config = require('config')
var senecaForwarder = require('../../senecaForwarder.js')

module.exports = function () {
  var forwarder = senecaForwarder.bind(undefined, 'drones')

  return [{
    path: config.apiPrefix + 'drones',
    method: 'GET',
    handler: function (request, reply) {
      forwarder('get', {}, function (err, results) {
        if (err) reply('').code(503) // Service Unavailable
        else reply(results)
      })
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
      forwarder('register', request.payload, function (err, results) {
        if (err) reply('').code(503) // Service Unavailable
        else reply(results)
      })
    }
  }, {
    path: config.apiPrefix + 'drones/{id}/checkin',
    method: 'PUT',
    handler: function (request, reply) {
      var id = request.params.id
      var payload = request.payload

      forwarder('checkin', {id: id, data: payload}, function (err, results) {
        if (err) reply('').code(503) // Service Unavailable
        else reply(results)
      })
    }
  }]
}
