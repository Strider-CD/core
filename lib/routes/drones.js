'use strict'

var config = require('config')
var web = require('hapi-decorators')
var Drone = require('../models/drone')
var bcrypt = require('bcrypt')
var uuid = require('node-uuid')
var JWT = require('jsonwebtoken')
var dronePath = config.apiPrefix + 'drones'

@web.controller(dronePath)
class Drones {
  /*
   * Returns all drones
   */
  @web.get('/')
  all (request, reply) {
    Drone.findByQuery({}).then(function (list) {
      reply(list.map(item => {
        if (item.session) item.session = undefined // filter out session before replying
      }))
    }).catch(function (err) {
      reply(err).code(503)
    })
  }

  /*
   * Saves a drone and replies a token
   */
  @web.post('/')
  create (request, reply) {
    var drone = request.payload
    if (!(drone.name)) return reply('malformed request').code(400)
    Drone.save(drone).then(function (id) {
    Drone.findByQuery({'id': id}).then(function (list) {
    if (list.length < 1) return reply('').code(503)
      let drone = list[0]
      drone.session = generateSession(id)
      let token = JWT.sign(drone.session, config.jwtSecret)
      Drone.update(drone.id, drone).then(function (id) {
        reply({text: 'Check auth headers for your token'}).header('Authorization', token)
      }).catch(function (err) {
        reply(err).code(503)
      })
      }).catch(function (error) {
        reply(error).code(503)
      })
    })
  }

  /*
   * Refresh session and token information for a drone
   */
  @web.get('/session/refresh')
  login (request, reply) {
    let id = request.auth.credentials.parrent
    Drone.findByQuery({'id': id}).then(function (list) {
      if (list.length < 1) return reply('').code(503)
      let drone = list[0]
      drone.session = generateSession(id)
      let token = JWT.sign(drone.session, config.jwtSecret)
      Drone.update(drone.id, drone).then(function (id) {
        reply({text: 'Check auth headers for your token'}).header('Authorization', token)
      }).catch(function (err) {
        reply(err).code(404)
      })
    }).catch(function (err) {
      reply(err).code(503)
    })
  }

  @web.put(`/{id}/checkin`)
  checkIn (request, reply) {
    var drone = request.payload
    drone.id = request.params.id

    if (typeof drone.id !== 'string') {
      return reply('invalid drone').code(400)
    }

    Drone.update(drone.id, drone).then(function (id) {
      reply({ id, status: 'ready', onPostAuth: true })
    }).catch(function (err) {
      reply(err).code(404)
    })
  }
}

function generateSession(id) {
  return {
    parrent: id,
    id: uuid.v1(),
    type: 'drone',
    valid: true,
    exp: new Date().getTime() + 5 * 365 * 24 * 60 * 60 * 1000 // expires in 5 years
  }
}

module.exports = Drones
