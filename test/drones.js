'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

require('babel/register')

var tape = require('tape')
var server = require('../index')
var config = require('config')
var Drone = require('../lib/models/drone')

var apiPrefix = config.apiPrefix

var basicHeader = function (username, password) {
  return 'Basic ' + (new Buffer(username + ':' + password, 'utf8')).toString('base64')
}

var token = null

tape('drones - login with admin', function (t) {
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

tape('drones - list before register', function (t) {
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
    t.end()
  })
})

tape('drones - register', function (t) {
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
    var id = res.result
    t.equal(res.statusCode, 200)
    t.ok(id, typeof id === 'string', 'Drone ready')
    t.end()
  })
})

tape('drones - checkin', function (t) {
  var options = {
    url: apiPrefix + 'drones/checkin',
    method: 'GET',
    headers: {
      authorization: basicHeader('drone1', 'secure')
    }
  }

  server.inject(options, function (res) {
    t.equal(res.statusCode, 200)
    t.end()
  })
})

tape('drones - list after register', function (t) {
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
    t.ok(data.length > 0, 'Data has results')
    t.end()
  })
})
