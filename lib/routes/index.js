'use strict'

var Drones = require('./drones')
var github = require('./github')
var jobs = require('./jobs')
var projects = require('./projects')

module.exports = function (emitter) {
  var drones = new Drones()

  return [].concat(
    projects(),
    drones.routes(),
    github(emitter),
    jobs(emitter)
  )
}
