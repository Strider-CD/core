'use strict'

var Joi = require('joi')
var config = require('config')
var Project = require('../models/project')
var projectPath = config.apiPrefix + 'projects'

module.exports = function (emitter) {
  return [{
    path: `${projectPath}`,
    method: 'GET',
    handler (request, reply) {
      Project.findByQuery({}).then(function (list) {
        reply(list)
      }).catch(function (err) {
        reply(err).code(503)
      })
    }
  }, {
    path: `${projectPath}/{id}`,
    method: 'GET',
    config: {
      validate: {
        params: Joi.object().keys({
          id: Joi.string().guid() // GUID are very similar to UUID
        })
      }
    },
    handler (request, reply) {
      var id = request.params.id
      Project.findByQuery({'id': id}).then(function (list) {
        if (list.length > 0) {
          reply(list[0])
        } else {
          reply()
        }
      }).catch(function (err) {
        reply(err).code(503)
      })
    }
  }, {
    path: `${projectPath}`,
    method: 'POST',
    handler (request, reply) {
      var project = request.payload

      Project.save(project).then(id => {
        reply(id)
      }).catch(err => reply(err).code(503))
    }
  }, {
    path: `${projectPath}/{id}/webhooks/{providerId}`,
    method: 'POST',
    config: {
      validate: {
        params: Joi.object().keys({
          providerId: Joi.string()
            .only('github', 'bitbucket', 'gitlab', 'rest'),
          id: Joi.string().guid() // GUID are very similar to UUID
        })
      }
    },
    handler (request, reply) {
      var providerId = request.params.providerId
      var id = request.params.id
      var payload = request.payload
      payload['project'] = id

      // TODO: check whether the project exists + check if the provider is associated with the project

      switch (providerId) {
        case 'github':
          // TODO: Github specific json validation (at least for PR's and master merges)
          // TODO: Test whether the request comes from github -> abort if not
          payload['event'] = request.headers['x-github-event']

          emitter.emit(`${providerId}.webhooks.handle`, payload, function (err, results) {
            if (err) reply() // Github will never be interested in our status or any reply
            else reply()
          })
          break
        case 'bitbucket':
          reply(`${providerId}: not Implemented yet!`).code(501)
          break
        case 'gitlab':
          reply(`${providerId}: not Implemented yet!`).code(501)
          break
        case 'rest':
          reply(`${providerId}: not Implemented yet!`).code(501)
          break
      }
    }
  }]
}
