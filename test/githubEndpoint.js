'use strict'
// post on testing hapi https://medium.com/the-spumko-suite/testing-hapi-services-with-lab-96ac463c490a

var tape = require('tape')
var server = require('../index.js')
var config = require('config')
var pull_request = require('./fixtures/github/pull_request.js')

var apiPrefix = config.apiPrefix
tape('githubEndpoint - handleWebhook - receive pull request', function (t) {
  var options = {
    url: apiPrefix + 'github',
    method: 'POST',
    headers: {
      'X-Github-Event': 'pull_request'
    },
    payload: JSON.stringify(pull_request)
  }
  server.inject(options, function (res) {
    var data = res.result
    t.equal(res.statusCode, 200)
    t.ok(data === null, 'empty response as expected')
    t.end()
  })
})
