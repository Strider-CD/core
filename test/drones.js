'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

var server = require('../lib/index')
var Drone = require('../lib/models/drone')
var Job = require('../lib/models/job')
var Project = require('../lib/models/project')
var v = require('validator')
var test = require('./helpers/persistence')
var config = require('config')

var apiPrefix = config.apiPrefix

var basicHeader = function (username, password) {
  return 'Basic ' + (new Buffer(username + ':' + password, 'utf8')).toString('base64')
}

var token = null
var droneToken = null
var createdProjectId = null

Drone.purge()
Job.purge()
Project.purge()

test('drones - login with admin', function (t) {
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
    server.stop(t.end)
  })
})

test('drones - list before register', function (t) {
  // clean drone collection
  Drone.purge()
  var options = {
    url: apiPrefix + 'drones',
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
    server.stop(t.end)
  })
})

test('drones - register', function (t) {
  var options = {
    url: apiPrefix + 'drones',
    method: 'POST',
    payload: {
      name: 'drone1',
      secret: 'secure'
    },
    headers: {
      authorization: token
    }
  }

  server.inject(options, function (res) {
    droneToken = JSON.parse(res.payload).token
    t.equal(res.statusCode, 200)
    t.ok(droneToken !== token && typeof droneToken === 'string', 'Drone has a token')
    server.stop(t.end)
  })
})

test('drones - list after register using drone Token', function (t) {
  var options = {
    url: apiPrefix + 'drones',
    method: 'GET',
    headers: {
      authorization: droneToken
    }
  }

  server.inject(options, function (res) {
    var data = res.result

    t.equal(res.statusCode, 200)
    t.ok(data && Array.isArray(data), 'Data is array')
    t.ok(data.length > 0, 'Data has results')
    server.stop(t.end)
  })
})

test('drones - list after register using drone Token', function (t) {
  var options = {
    url: apiPrefix + 'drones',
    method: 'GET',
    headers: {
      authorization: droneToken
    }
  }

  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data && Array.isArray(data), 'Data is array')
    t.ok(data.length > 0, 'Data has results')
    server.stop(t.end)
  })
})

test('drones - create a project in order to inject a job', function (t) {
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
    server.stop(t.end)
  })
})

Drone.purge()
