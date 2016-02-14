'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

require('babel/register')

var server = require('../index')
var config = require('config')
var v = require('validator')
var Project = require('../lib/models/project')
var Job = require('../lib/models/job')
var pull_request = require('./fixtures/github/pull_request')
var tape = require('./helpers/persistence')

var apiPrefix = config.apiPrefix
var createdProjectId = ''
var timeBeforeJobSubmit
// clean job and project collection
Project.purge()
Job.purge()

var token = null

var basicHeader = function (username, password) {
  return 'Basic ' + (new Buffer(username + ':' + password, 'utf8')).toString('base64')
}

tape('project - login with admin', function (t) {
  var options = {
    url: apiPrefix + 'users/login',
    method: 'GET',
    headers: {
      authorization: basicHeader(config.adminUser, config.adminPwd)
    }
  }

  server.inject(options, function (res) {
    token = res.headers.authorization
    t.ok(token && token.length > 10, 'Got token')
    t.equal(res.statusCode, 200)
    t.end()
  })
})

tape('projects - list', function (t) {
  // clean drone collection
  Project.purge()

  var options = {
    url: apiPrefix + 'projects',
    method: 'GET',
    headers: {
      authorization: token
    }
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
      name: 'test-project',
      provider: {
        type: 'github'
      }
    },
    headers: {
      authorization: token
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

tape('projects - check list of projects after create', function (t) {
  var options = {
    url: apiPrefix + 'projects',
    method: 'GET',
    headers: {
      authorization: token
    }
  }

  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data.length > 0, 'project present')
    t.ok(data[0].id && typeof data[0].id === 'string', 'project has id')
    t.ok(data[0].id === createdProjectId, 'project id same as created')
    t.end()
  })
})

tape('projects - webhook github', function (t) {
  var options = {
    url: apiPrefix + 'projects/' + createdProjectId + '/webhooks/github',
    method: 'POST',
    headers: {
      'X-Github-Event': 'pull_request'
    },
    payload: JSON.stringify(pull_request)
  }
  timeBeforeJobSubmit = new Date().getTime()
  server.inject(options, function (res) {
    t.equal(res.statusCode, 200)
    t.equal(res.result, null, 'Webhook ready')
    t.end()
  })
})

tape('project - check list of jobs', function (t) {
  var options = {
    url: apiPrefix + 'jobs',
    method: 'GET',
    headers: {
      authorization: token
    }
  }

  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data.length > 0, 'job present')
    t.ok(data[0].id && typeof data[0].id === 'string', 'job has id')
    t.end()
  })
})

tape('projects - find jobs created before the first job got submitted', function (t) {
  var options = {
    url: apiPrefix + 'projects/' + createdProjectId + '/jobs/receivedAt/lt/' + timeBeforeJobSubmit,
    method: 'GET',
    headers: {
      authorization: token
    }
  }

  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data.length === 0, 'no job was created before')
    t.end()
  })
})

tape('projects - find jobs after first job was submitted', function (t) {
  var options = {
    url: apiPrefix + 'projects/' + createdProjectId + '/jobs/receivedAt/gte/' + timeBeforeJobSubmit,
    method: 'GET',
    headers: {
      authorization: token
    }
  }

  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data.length === 1 && (data[0].receivedAt >= timeBeforeJobSubmit), 'one job was created after')
    t.end()
  })
})

tape('projects - webhook gitlab', function (t) {
  var options = {
    url: apiPrefix + 'projects/' + createdProjectId + '/webhooks/gitlab',
    method: 'POST',
    payload: {
    },
    headers: {
      authorization: token
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
    url: apiPrefix + 'projects/' + createdProjectId + '/webhooks/bitbucket',
    method: 'POST',
    payload: {
    },
    headers: {
      authorization: token
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
    url: apiPrefix + 'projects/' + createdProjectId + '/webhooks/rest',
    method: 'POST',
    payload: {
    },
    headers: {
      authorization: token
    }
  }

  server.inject(options, function (res) {
    t.equal(res.result, 'rest: not Implemented yet!', 'rest not implemented yet!')
    t.equal(res.statusCode, 501, 'not implemented')
    t.end()
  })
})

Project.purge()
Job.purge()
