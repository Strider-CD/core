'use strict'

var Drones = require('./drones')
var jobs = require('./jobs')
var projects = require('./projects')

module.exports = function (emitter) {
  var drones = new Drones()

  return [].concat(
    projects(emitter),
    drones.routes(),
    jobs(emitter)
  )
}
