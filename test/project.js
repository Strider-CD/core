'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

require('babel/register')

var tape = require('tape')
var server = require('../index')
var config = require('config')
var v = require('validator')
var Project = require('../lib/models/project')
var Job = require('../lib/models/job')
var pull_request = require('./fixtures/github/pull_request')

var apiPrefix = config.apiPrefix
var createdProjectId = ''
// clean job collection
Job.purge()

tape('projects - list', function (t) {
  // clean drone collection
  Project.purge()

  var options = {
    url: apiPrefix + 'projects',
    method: 'GET'
  }

  server.inject(options, function (res) {
    var data = res.result

    t.equal(res.statusCode, 200)
    t.ok(data && Array.isArray(data), 'Data is array')
    t.ok(data.length === 0, 'Data has no results')
    t.end()
  })
})

tape('projects - create', function (t) {
  var options = {
    url: apiPrefix + 'projects',
    method: 'POST',
    payload: {
      provider: {
        type: 'github'
      }
    }
  }

  server.inject(options, function (res) {
    createdProjectId = res.result

    t.equal(res.statusCode, 200)
    t.ok(createdProjectId,
      typeof createdProjectId === 'string' && v.isUUID(createdProjectId),
      'Project ready')
    t.end()
  })
})

tape('projects - webhook github', function (t) {
  var options = {
    url: apiPrefix + `projects/${createdProjectId}/webhooks/github`,
    method: 'POST',
    headers: {
      'X-Github-Event': 'pull_request'
    },
    payload: JSON.stringify(pull_request)
  }
  server.inject(options, function (res) {
    t.equal(res.statusCode, 200)
    t.equal(res.result, null, 'Webhook ready')
    t.end()
  })
})

tape('project - check list of jobs', function (t) {
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

tape('projects - webhook gitlab', function (t) {
  var options = {
    url: apiPrefix + `projects/${createdProjectId}/webhooks/gitlab`,
    method: 'POST',
    payload: {
    }
  }

  server.inject(options, function (res) {
    t.equal(res.result, 'gitlab: not Implemented yet!', 'gitlab not implemented yet!')
    t.equal(res.statusCode, 501, 'not implemented')
    t.end()
  })
})

tape('projects - webhook bitbucket', function (t) {
  var options = {
    url: apiPrefix + `projects/${createdProjectId}/webhooks/bitbucket`,
    method: 'POST',
    payload: {
    }
  }

  server.inject(options, function (res) {
    t.equal(res.result, 'bitbucket: not Implemented yet!', 'bitbucket not implemented yet!')
    t.equal(res.statusCode, 501, 'not implemented')
    t.end()
  })
})

tape('projects - webhook rest', function (t) {
  var options = {
    url: apiPrefix + `projects/${createdProjectId}/webhooks/rest`,
    method: 'POST',
    payload: {
    }
  }

  server.inject(options, function (res) {
    t.equal(res.result, 'rest: not Implemented yet!', 'rest not implemented yet!')
    t.equal(res.statusCode, 501, 'not implemented')
    t.end()
  })
})
