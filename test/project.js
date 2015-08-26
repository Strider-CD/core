'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

require('babel/register')

var tape = require('tape')
var server = require('../index')
var config = require('config')
var Project = require('../lib/models/project')

var apiPrefix = config.apiPrefix

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
