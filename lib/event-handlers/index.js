'use strict'

var drones = require('./drones')
var github = require('./github')
var jobs = require('./jobs')
var projects = require('./projects')

module.exports = function (emitter) {
  projects(emitter)
  drones(emitter)
  github(emitter)
  jobs(emitter)
}
