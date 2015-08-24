'use strict'

var drones = require('./drones')
var github = require('./github')
var jobs = require('./jobs')

module.exports = function (emitter) {
  drones(emitter)
  github(emitter)
  jobs(emitter)
}
