'use strict'

var config = require('config')
var ReadWriteLock = require('rwlock')
var jobsPath = config.apiPrefix + 'jobs'

module.exports = function (emitter) {
  var retrieveLock = new ReadWriteLock()

  return [{
    path: `${jobsPath}/{query*2}`,
    method: 'GET',
    handler (request, reply) {
      var splitQuery = request.params.query.split('/')
      var query = {}
      query[splitQuery[0]] = splitQuery[1]

      emitter.emit('jobs.find', query, function (err, results) {
        if (err) reply('').code(400) // most likely malformed query
        else reply(results)
      })
    }
  }, {
    path: jobsPath,
    method: 'GET',
    handler (request, reply) {
      emitter.emit('jobs.find', null, function (err, results) {
        if (err) reply('').code(400) // most likely malformed query
        else reply(results)
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
  }]
}
