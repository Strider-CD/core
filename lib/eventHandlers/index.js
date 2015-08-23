var drones = require('./drones.js')
var github = require('./github.js')
var jobs = require('./jobs.js')

module.exports = function (emitter) {
  drones(emitter)
  github(emitter)
  jobs(emitter)
}
