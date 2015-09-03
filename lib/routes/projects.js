'use strict'

var Joi = require('joi')
var config = require('config')
var Project = require('../models/project')
var projectPath = config.apiPrefix + 'projects'

module.exports = function () {
  return [{
    path: projectPath,
    method: 'GET',
    handler (request, reply) {
      Project.findByQuery({}).then(function (list) {
        reply(list)
      }).catch(function (err) {
        reply(err).code(503)
      })
    }
  }, {
    path: projectPath,
    method: 'POST',
    handler (request, reply) {
      var project = request.payload

      Project.save(project).then(id => {
        reply(id)
      }).catch(err => reply(err).code(503))
    }
  }, {
    path: `${projectPath}/webhooks/{providerId}`,
    method: 'POST',
    config: {
      validate: {
        params: Joi.object().keys({
          providerId: Joi.string()
            .only('github', 'bitbucket', 'gitlab')
        })
      }
    },
    handler (request, reply) {
      var providerId = request.params.providerId

      reply(providerId)
    }
  }]
}
