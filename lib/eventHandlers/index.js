var drones = require('./drones.js')
var github = require('./github.js')
var jobs = require('./jobs.js')

module.exports = function (emitter, client) {
  drones(emitter, client)
  github(emitter, client)
  jobs(emitter, client)
}
