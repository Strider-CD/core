'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

require('babel/register')

var tape = require('tape')
var server = require('../index.js')
var config = require('config')
var Job = require('../lib/models/job.js').Job
var pull_request = require('./fixtures/github/pull_request.js')

var apiPrefix = config.apiPrefix
var retrievedJob = null

tape('job - database should be empty', function (t) {
  // clean job collection
  Job.collection().purge()

  var options = {
    url: apiPrefix + 'jobs',
    method: 'GET'
  }
  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.same(data, [], 'no jobs avaiable as expected')
    t.end()
  })
})

tape('job - creating a job by injecting a pull request through a github webhook', function (t) {
  var options = {
    url: apiPrefix + 'github',
    method: 'POST',
    headers: {
      'X-Github-Event': 'pull_request'
    },
    payload: JSON.stringify(pull_request)
  }
  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data === null, 'empty response as expected')
    t.end()
  })
})

// TODO: test mongodb like query strings which can be sent as 'payload'
// e.g. '{}' list all jobs
// '{status: received}' for unprocessed jobs etc.
tape('job - check list of jobs', function (t) {
  var options = {
    url: apiPrefix + 'jobs',
    method: 'GET'
  }
  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data.length > 0, 'job present')
    t.ok(data[0].id && typeof data[0].id === 'string', 'job has id')
    t.end()
  })
})

tape('job - get a job from the queue', function (t) {
  var options = {
    url: apiPrefix + 'jobs/retrieve',
    method: 'GET'
  }
  server.inject(options, function (res) {
    var data = res.result
    retrievedJob = data // for the update test
    t.equal(res.statusCode, 200)
    t.ok(Job.collection()._validate(data), 'job conforms to schema')
    t.ok(data.status && data.status === 'running', 'job is now marked as running')
    t.ok(data.id && (typeof data.id === 'string') && data.id.length > 5, 'job has id')
    t.end()
  })
})

tape('job - try to get a second job from the queue', function (t) {
  var options = {
    url: apiPrefix + 'jobs/retrieve',
    method: 'GET'
  }
  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 503) // resource temporarly not avaiable
    t.ok(!Job.collection()._validate(data), 'job does not conform to schema')
    t.end()
  })
})

tape('job - check list of jobs again', function (t) {
  var options = {
    url: apiPrefix + 'jobs',
    method: 'GET'
  }
  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data.length === 1, 'only one job should be present')
    t.ok(data[0].id && typeof data[0].id === 'string', 'job has id')
    t.ok(data[0].status && data[0].status === 'running', 'job status should be running')
    t.end()
  })
})

tape('job - creating a second job by injecting a pull request through a github webhook', function (t) {
  var options = {
    url: apiPrefix + 'github',
    method: 'POST',
    headers: {
      'X-Github-Event': 'pull_request'
    },
    payload: JSON.stringify(pull_request)
  }
  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data === null, 'empty response as expected')
    t.end()
  })
})

tape('job - find only received jobs', function (t) {
  var options = {
    url: apiPrefix + 'jobs/status/received',
    method: 'GET',
    payload: JSON.stringify({'status': 'received'})
  }
  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data.length === 1, 'only one job should be present')
    t.ok(data[0].id && typeof data[0].id === 'string', 'job has id')
    t.ok(data[0].status && data[0].status === 'received', 'job status should be received')
    t.end()
  })
})

tape('job - update job', function (t) {
  retrievedJob.stdout = 'did\nmy\nwork\n'
  retrievedJob.stderr = 'one\nerror\n'
  retrievedJob.status = 'finished'
  retrievedJob.result = 'success'

  var options = {
    url: apiPrefix + 'jobs/id/' + retrievedJob.id,
    method: 'PUT',
    payload: JSON.stringify(retrievedJob)
  }

  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data && typeof data === 'string' && data === retrievedJob.id, 'got id of updated job back')
    t.end()
  })
})

tape('job - find only finished jobs', function (t) {
  var options = {
    url: apiPrefix + 'jobs/status/finished',
    method: 'GET'
  }
  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data.length === 1, 'only one job should be present')
    t.ok(data[0].id && typeof data[0].id === 'string', 'job has id')
    t.ok(data[0].status && data[0].status === 'finished', 'job status should be finished')
    t.end()
  })
})
