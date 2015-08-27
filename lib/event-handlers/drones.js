'use strict'

var Drone = require('../models/drone')

module.exports = function (emitter) {
  emitter.on('drones.get', get)
  emitter.on('drones.register', register)
  emitter.on('drones.checkIn', checkIn)

  function get (query, cb) {
    var droneQuery = query || {}
    Drone.findByQuery(droneQuery).then(function (list) {
      cb(null, list)
    }).catch(function (err) {
      cb(err, {})
    })
  }

  function register (drone, cb) {
    Drone.save(drone).then(function (id) {
      cb(undefined, id)
    }).catch(function (err) {
      cb(err)
    })
  }

  function checkIn (drone, cb) {
    if (typeof drone.id !== 'string') {
      cb('invalid drone')
      return
    }

    Drone.update(drone.id, drone).then(function (id) {
      cb(null, {'id': id, 'onPostAuth': true, 'status': 'ready' })
    }).catch(function (err) {
      cb(err)
    })
  }
}
