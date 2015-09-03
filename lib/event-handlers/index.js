'use strict'

var github = require('./github')
var jobs = require('./jobs')

module.exports = function (emitter, client) {
  github(emitter, client)
  jobs(emitter, client)
}
