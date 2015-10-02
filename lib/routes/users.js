'use strict'

var config = require('config')
var web = require('hapi-decorators')
var User = require('../models/user')
var bcrypt = require('bcrypt')
var uuid = require('node-uuid')
var JWT = require('jsonwebtoken')
var userPath = config.apiPrefix + 'users'

@web.controller(userPath)
class Users {
  @web.get('/')
  all (request, reply) {
    User.findByQuery({}).then(function (list) {
      reply(list.map(item => {
        if (item.secret) item.secret = undefined // filter out secret before replying
      }))
    }).catch(function (err) {
      reply(err).code(503)
    })
  }

  @web.post('/')
  create (request, reply) {
    var user = request.payload
    if (!(user.secret) || !(user.name)) return reply('malformed request').code(400)
    // hash secret and store user in DB
    bcrypt.genSalt(10, function (err, salt) {
      if (err) return reply(err).code(503)
      bcrypt.hash(user.secret, salt, function (err, hash) {
        if (err) return reply(err).code(503)
        user.secret = hash
        user.save(user).then(function (id) {
          reply(id)
        }).catch(function (error) {
          reply(error).code(503)
        })
      })
    })
  }

  @web.config({
      auth: 'userBasicAuth'
  })
  @web.get('/login')
  login (request, reply) {
    let id = request.auth.credentials.id
    let name = request.auth.credentials.name
    if (name === 'guest') {
      let session = {
        parrent: id,
        id: id,
        type: 'guest',
        valid: true,
        exp: new Date().getTime() + 24 * 60 * 60 * 1000 // expires in 24 hours
      }
      let token = JWT.sign(session, config.jwtSecret)
      return reply({token: token}).header('Authorization', token)
    }
    User.findByQuery({'id': id}).then(function (list) {
      if (list.length < 1) return reply('').code(503)
      let user = list[0]
      user.session = {
        parrent: id,
        id: uuid.v1(),
        type: 'user',
        valid: true,
        exp: new Date().getTime() + 24 * 60 * 60 * 1000 // expires in 24 hours
      }
      let token = JWT.sign(user.session, config.jwtSecret)
      User.update(user.id, user).then(function (id) {
        reply({token: token}).header('Authorization', token)
      }).catch(function (err) {
        reply(err).code(404)
      })
    }).catch(function (err) {
      reply(err).code(503)
    })
  }
}

module.exports = Users
