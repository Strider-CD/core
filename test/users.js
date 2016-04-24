'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

require('babel/register')({
  optional: ['es7.decorators', 'es7.objectRestSpread']
})

var server = require('../index')
var test = require('./helpers/persistence')
var config = require('config')

var apiPrefix = config.apiPrefix

var basicHeader = function (username, password) {
  return 'Basic ' + (new Buffer(username + ':' + password, 'utf8')).toString('base64')
}

var token = null

test('user - list before login', function (t) {
  var options = {
    url: apiPrefix + 'users',
    method: 'GET'
  }

  server.inject(options, function (res) {
    t.equal(res.statusCode, 401)
    server.stop(t.end)
  })
})

test('user - login', function (t) {
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

test('user - list after login', function (t) {
  var options = {
    url: apiPrefix + 'users',
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
    server.stop(t.end)
  })
})
