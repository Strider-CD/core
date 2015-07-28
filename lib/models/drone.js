'use strict'

var Promise = require('bluebird')
var mockDrones = []

exports.create = function (data) {
  data.id = 1
  data.token = 'mocktoken.1'

  mockDrones.push(data)

  return Promise.resolve(data)
}

exports.checkIn = function (id, data) {
  return Promise.resolve({ droneId: id, onPostAuth: true, status: 'ready' })
}
