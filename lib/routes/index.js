'use strict'

var Drones = require('./drones')
var jobs = require('./jobs')
var projects = require('./projects')
var Users = require('./users')

module.exports = function (emitter) {
  var drones = new Drones()
  var users = new Users()

  return [].concat(
    projects(emitter),
    drones.routes(),
    jobs(emitter),
    users.routes()
  )
}
