'use strict'

var github = require('./github')
var jobs = require('./jobs')

module.exports = function (emitter) {
  github(emitter)
  jobs(emitter)
}
