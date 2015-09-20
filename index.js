'use strict'

require('babel/register')({
  optional: ['es7.decorators', 'es7.objectRestSpread']
})

var Hapi = require('hapi')
var hapiAuthBasic = require('hapi-auth-basic')
var hapiAuthJWT = require('hapi-auth-jwt2')
var auth = require('./lib/auth')
var bcrypt = require('bcrypt')
var config = require('config')
var EventEmitter = require('eventemitter3')
var logger = require('./lib/util/log')(module)
var routes = require('./lib/routes')
var eventHandlers = require('./lib/event-handlers')
var PrimusHandler = require('./lib/primus-handlers')
var User = require('./lib/models/user')
var server = new Hapi.Server({
  connections: {
    routes: {
      cors: true
    }
  }
})

server.connection({
  port: config.port
})

var primus = new PrimusHandler(server)
server.primus = primus

var emitter = new EventEmitter()
eventHandlers(emitter, primus)

// Super simple logging
// TODO: add something more inteligent, maybe using `good` module
server.on('response', function (request) {
  console.log(request.info.remoteAddress + ' : ' + request.method.toUpperCase() + ' ' + request.url.path + ' --> ' + request.response.statusCode)
})

var hapiPlugins = [hapiAuthBasic, hapiAuthJWT]
server.register(hapiPlugins, function (err) {
  if (err) {
    return console.error(err)
  }
  // Basic auth for drones
  server.auth.strategy('droneBasicAuth', 'basic', { validateFunc: auth.droneBasicAuth })
  // Basic auth for drones
  server.auth.strategy('userBasicAuth', 'basic', { validateFunc: auth.userBasicAuth })
  // JWT for drones, users and API calls (using user token)
  server.auth.strategy('jwtAuth', 'jwt',
    { key: config.jwtSecret,
      validateFunc: auth.jwtAuth,
      verifyOptions: { algorithms: [ 'HS256' ] }
    })
  //server.auth.default('jwtAuth')
  server.route(routes(emitter))
})
setUpAdminUser()

if (!module.parent) {
  server.start(function (err) {
    if (err) {
      return console.error(err)
    }

    if (!(process.env.STRIDER_ADMIN_USER) || !(process.env.STRIDER_ADMIN_PWD)) {
      logger.warn('WARNING: using default admin user name and password')
    }
    logger.info('Server started', server.info.uri)
  })
}

function setUpAdminUser () {
  var salt = bcrypt.genSaltSync(10)
  var admin = {
    name: config.adminUser,
    secret: bcrypt.hashSync(config.adminPwd, salt),
    role: 'admin',
    projects: []
  }
  User.save(admin).then(function (id) {
    logger.info('created admin user')
  }).catch(function (err) {
    logger.warn('failed to create admin user', err)
  })
}

module.exports = server
