'use strict'

var Joi = require('joi')
var config = require('config')
var Project = require('../models/project')
var Job = require('../models/job')
var projectPath = config.apiPrefix + 'projects'

module.exports = function (emitter) {
  return [{
    path: `${projectPath}`,
    method: 'GET',
    config: {
      auth: false
    },
    handler (request, reply) {
      Project.findByQuery({}).then(function (list) {
        reply(list)
      }).then(null, function (err) {
        reply(err).code(503)
      })
    }
  }, {
    path: `${projectPath}/{id}`,
    method: 'GET',
    config: {
      auth: false,
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
      }).then(null, function (err) {
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
      }).then(null, err => reply(err).code(503))
    }
  }, {
    path: `${projectPath}/{id}/webhooks/rest`,
    method: 'POST',
    config: {
      validate: {
        params: Joi.object().keys({
          id: Joi.string().guid() // GUID are very similar to UUID
        })
      }
    },
    handler (request, reply) {
      var id = request.params.id
      var payload = request.payload
      payload['project'] = id

      // TODO: check whether the project exists + check if the provider is associated with the project
      reply(`rest: not Implemented yet!`).code(501)
    }
  }, {
    path: `${projectPath}/{id}/webhooks/{providerId}`,
    method: 'POST',
    config: {
      auth: false,
      validate: {
        params: Joi.object().keys({
          providerId: Joi.string()
            .only('github', 'bitbucket', 'gitlab'),
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
  }, {
    path: `${projectPath}/{id}/jobs/{query*3}`,
    method: 'GET',
    handler (request, reply) {
      // TODO: get rid of code duplication (see projects.js routes)
      var id = request.params.id
      var splitQuery = request.params.query.split('/')
      splitQuery = splitQuery.slice(Math.max(splitQuery.length - 3, 0)) // last three elements
      var query = {}
      var cmpOperatorValuePair = {}

      // request pattern is ..jobs/<field in job>/< compare operator (see loki docs)>/<value>
      // TODO: shorten this
      let fieldInJob = splitQuery[0]
      let cmpOperator = `\$${splitQuery[1]}`
      let value = splitQuery[2]
      cmpOperatorValuePair[cmpOperator] = value
      query[fieldInJob] = cmpOperatorValuePair
      Job.findByQuery({'$and': [{project: id}, query]}).then(function (list) {
        reply(list.slice(Math.max(list.length - 100, 0))) // reply only the newest 100 entries
      }).then(null, function (err) {
        reply(err).code(400)
      })
    }
  }, {
    path: `${projectPath}/{id}/jobs/{query*2}`,
    method: 'GET',
    handler (request, reply) {
      // TODO: get rid of code duplication (see projects.js routes)
      var id = request.params.id
      var splitQuery = request.params.query.split('/')
      splitQuery = splitQuery.slice(Math.max(splitQuery.length - 2, 0)) // last two elements
      var query = {}

      query[splitQuery[0]] = splitQuery[1]

      Job.findByQuery({'$and': [{project: id}, query]}).then(function (list) {
        reply(list.slice(Math.max(list.length - 100, 0))) // reply only the newest 100 entries
      }).then(null, function (err) {
        reply(err).code(400)
      })
      emitter.emit('jobs.frontend.getByQuery', {'$and': [{project: id}, {parent: ''}, query]}, function (err, results) {
        if (err) {
          reply('').code(400) // most likely malformed query
        } else {
          reply(results)
        }
      })
    }
  }, {
    path: `${projectPath}/{id}/jobs/id/{jobId}`,
    method: 'GET',
    handler (request, reply) {
      // TODO: get rid of code duplication (see projects.js routes)
      var id = request.params.id
      var jobId = request.params.jobId
      /*
      Job.findByQuery({'$and': [{project: id}, {id: jobId}]}).then(function (list) {
        reply(list.slice(Math.max(list.length - 100, 0))) // reply only the newest 100 entries
      }).then(null, function (err) {
        reply(err).code(400)
      })
      */
      emitter.emit('jobs.frontend.getByQuery', {'$and': [{project: id}, {id: jobId}]}, function (err, results) {
        if (err) {
          reply('').code(400) // most likely malformed query
        } else {
          reply(results)
        }
      })
    }
  }, {
    path: `${projectPath}/{id}/jobs`,
    method: 'GET',
    config: {
      auth: false
    },
    handler (request, reply) {
      var id = request.params.id
      // TODO: get rid of code duplication (see projects.js routes)
      emitter.emit('jobs.frontend.getByQuery', {'$and': [{project: id}, {parent: ''}]}, function (err, results) {
        if (err) {
          reply('').code(400) // most likely malformed query
        } else {
          reply(results)
        }
      })
      /*
      Job.findByQuery({'$and': [{project: id}, {parent: ''}]}).then(function (list) {
        reply(list.slice(Math.max(list.length - 100, 0))) // reply only the newest 100 entries
      }).then(null, function (err) {
        reply(err).code(400)
      })
      */
    }
  }]
}
