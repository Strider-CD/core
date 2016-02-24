'use strict'

var config = require('config')
var web = require('hapi-decorators')
var Drone = require('../models/drone')
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
      var returnList = clone(list)
      returnList.slice().map((item) => {
        if (item.session) delete item.session // filter out session before replying
      })
      reply(returnList)
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
        if (!list.length) return reply('').code(503)

        let drone = list[0]
        drone.session = generateSession(id)
        let token = JWT.sign(drone.session, config.jwtSecret)
        drone.token = token

        Drone.update(drone.id, drone).then(function (id) {
          reply(drone)
        }).then(null, function (err) {
          reply(err).code(503)
        })
      }).then(null, function (error) {
        reply(error).code(503)
      })
    })
  }

  /*
   * Return a single drone by id
   */
  @web.get('/{id}')
  single (request, reply) {
    Drone.findOneById(request.params.id)
      .then((drone) => {
        reply(drone)
      })
      .catch((error) => reply(error.message).code(error.code || 500))
  }

  /*
   * Refresh session and token information for a drone
   */
  @web.get('/session/refresh')
  login (request, reply) {
    let id = request.auth.credentials.parent
    Drone.findByQuery({'id': id}).then(function (list) {
      if (!list.length) return reply('').code(503)

      let drone = list[0]
      drone.session = generateSession(id)
      let token = JWT.sign(drone.session, config.jwtSecret)

      Drone.update(drone.id, drone).then(function (id) {
        reply({text: 'Check auth headers for your token'}).header('Authorization', token)
      }).then(null, function (err) {
        reply(err).code(404)
      })
    }).then(null, function (err) {
      reply(err).code(503)
    })
  }

  @web.post('/checkin/{token}')
  checkIn (request, reply) {
    var token = request.params.token

    if (token) {
      JWT.verify(token, config.jwtSecret, function (err, decoded) {
        if (err) {
          return reply(err).code(401)
        }

        Drone.update(decoded.parent, { status: 'active' })
          .then((id) => {
            reply()
          })
          .catch((error) => {
            reply(error).code(500)
          })
      })
    } else {
      reply('missing token').code(400)
    }
  }
}

function generateSession (id) {
  return {
    parent: id,
    id: uuid.v1(),
    type: 'drone',
    valid: true,
    exp: new Date().getTime() + 5 * 365 * 24 * 60 * 60 * 1000 // expires in 5 years
  }
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

module.exports = Drones
