'use strict'

var config = require('config')
var projectPath = config.apiPrefix + 'projects'

module.exports = function (emitter) {
  return [{
    path: projectPath,
    method: 'GET',
    handler (request, reply) {
      emitter.emit('projects.get', {}, function (err, list) {
        if (err) reply('').code(503) // Service Unavailable
        else reply(list)
      })
    }
  }, {
    path: projectPath,
    method: 'POST',
    handler (request, reply) {
      var project = request.payload

      emitter.emit('projects.create', project, function (err, id) {
        if (err) reply('').code(503) // Service Unavailable
        else reply(id)
      })
    }
  }]
}
