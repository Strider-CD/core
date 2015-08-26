'use strict'

var drones = require('./drones')
var github = require('./github')
var jobs = require('./jobs')
var projects = require('./projects')

module.exports = function (emitter) {
  return [].concat(
    projects(emitter),
    drones(emitter),
    github(emitter),
    jobs(emitter)
  )
}
