'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

var tape = require('tape')
var server = require('../')

tape('drones - list', function (t) {
  var options = {
    url: '/api/drones',
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

tape('drone - checkin', function (t) {
  var options = {
    url: '/api/drones/1/checkin',
    method: 'PUT',
    payload: {
      status: 'ready'
    }
  }

  server.inject(options, function (res) {
    var data = res.result

    t.equal(res.statusCode, 200)
    t.same(data, { status: 'ready', droneId: '1', onPostAuth: true }, 'Drone ready')
    t.end()
  })
})
