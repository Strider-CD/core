'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

var tape = require('tape')
var server = require('../index.js')
var config = require('config')

var apiPrefix = config.apiPrefix
var droneId = 1

tape('drones - list before register', function (t) {
  var options = {
    url: apiPrefix + 'drones',
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

tape('drones - register', function (t) {
  var options = {
    url: apiPrefix + 'drones',
    method: 'POST',
    payload: {
      name: 'drone1'
    }
  }

  server.inject(options, function (res) {
    var data = res.result
    droneId = data.id
    t.equal(res.statusCode, 200)
    t.same(data.name, options.payload.name, 'Drone ready')
    t.end()
  })
})

tape('drones - list after register', function (t) {
  var options = {
    url: apiPrefix + 'drones',
    method: 'GET'
  }

  server.inject(options, function (res) {
    var data = res.result

    t.equal(res.statusCode, 200)
    t.ok(data && Array.isArray(data), 'Data is array')
    t.ok(data.length > 0, 'Data has results')
    t.end()
  })
})

tape('drones - checkin', function (t) {
  var options = {
    url: apiPrefix + 'drones/' + droneId + '/checkin',
    method: 'PUT',
    payload: {
      status: 'ready'
    }
  }

  server.inject(options, function (res) {
    var data = res.result

    t.equal(res.statusCode, 200)
    t.same(data, { status: 'ready', id: droneId, onPostAuth: true }, 'Drone ready')
    t.end()
  })
})
