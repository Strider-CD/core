'use strict'

var drones = require('./drones')
var github = require('./github')
var jobs = require('./jobs')

module.exports = function (emitter) {
  return [].concat(
    drones(emitter),
    github(emitter),
    jobs(emitter)
  )
}
