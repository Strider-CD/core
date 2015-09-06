'use strict'

var config = require('config')
var ReadWriteLock = require('rwlock')
var Job = require('../models/job')
var jobsPath = config.apiPrefix + 'jobs'

module.exports = function (emitter) {
  var retrieveLock = new ReadWriteLock()

  return [{
    path: `${jobsPath}/{query*3}`,
    method: 'GET',
    handler (request, reply) {
      var splitQuery = request.params.query.split('/')
      var query = {}
      var cmpOperatorValuePair = {}

      // request pattern is ..jobs/<field in job>/< compare operator (see loki docs)>/<value>
      // TODO: shorten this
      let fieldInJob = splitQuery[0]
      let cmpOperator = `\$${splitQuery[1]}`
      let value = splitQuery[2]
      cmpOperatorValuePair[cmpOperator] = value
      query[fieldInJob] = cmpOperatorValuePair
      Job.findByQuery(query).then(function (list) {
        reply(list.slice(Math.max(list.length - 100, 0))) // reply only the newest 100 entries
      }).catch(function (err) {
        reply(err).code(400)
      })
    }
  }, {
    path: `${jobsPath}/{query*2}`,
    method: 'GET',
    handler (request, reply) {
      var splitQuery = request.params.query.split('/')
      var query = {}

      query[splitQuery[0]] = splitQuery[1]

      Job.findByQuery(query).then(function (list) {
        reply(list.slice(Math.max(list.length - 100, 0))) // reply only the newest 100 entries
      }).catch(function (err) {
        reply(err).code(400)
      })
    }
  }, {
    path: jobsPath,
    method: 'GET',
    handler (request, reply) {
      Job.findByQuery({}).then(function (list) {
        reply(list)
      }).catch(function (err) {
        reply(err).code(400)
      })
    }
  }, {
    path: `${jobsPath}/retrieve`,
    method: 'GET',
    handler (request, reply) {
      retrieveLock.writeLock(function (release) {
        emitter.emit('jobs.queue.get', function (err, results) {
          if (err) reply('').code(400) // most likely malformed query
          else if (results === '') reply('').code(503) // no jobs in the queue; come back latter (not sure about this one)
          else reply(results)
        })

        release()
      })
    }
  }, {
    path: `${jobsPath}/id/{id}`,
    method: 'PUT',
    handler (request, reply) {
      var job = request.payload
      job.id = request.params.id
      emitter.emit('jobs.job.update', job, function (err, results) {
        if (err) reply('').code(400) // most likely malformed query
        else reply(results)
      })
    }
  }, {
    path: config.apiPrefix + 'jobs',
    method: 'POST',
    handler: function (request, reply) {
      var job = request.payload

      emitter.emit('jobs.queue.insert', job, function (err, results) {
        if (err) reply('').code(400) // most likely malformed query
        else reply(results)
      })
    }
  }]
}
