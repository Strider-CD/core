'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

require('babel/register')

var v = require('validator')
var config = require('config')
var server = require('../index')
var Environment = require('../lib/models/environment')
var tape = require('./helpers/persistence')

var apiPrefix = config.apiPrefix
var createdProjectId
var token

// clean job and project collection
Environment.purge()

var basicHeader = function (username, password) {
  return 'Basic ' + (new Buffer(username + ':' + password, 'utf8')).toString('base64')
}

tape('environment - login with admin', function (t) {
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

tape('environments - create test project', function (t) {
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

tape('environments - list', function (t) {
  var options = {
    url: `${apiPrefix}projects/${createdProjectId}/environments`,
    method: 'GET',
    headers: {
      authorization: token
    }
  }

  server.inject(options, function (res) {
    var data = res.result

    t.equal(res.statusCode, 200)
    t.ok(data && Array.isArray(data), 'Data is array')
    t.equal(data.length, 0, 'Data has no results')
    t.end()
  })
})
