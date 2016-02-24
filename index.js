'use strict'

require('babel/register')({
  optional: ['es7.decorators', 'es7.objectRestSpread']
})

var Hapi = require('hapi')
var hapiAuthBasic = require('hapi-auth-basic')
var hapiAuthJWT = require('hapi-auth-jwt2')
var good = require('good')
var auth = require('./lib/auth')
var bcrypt = require('bcryptjs')
var config = require('config')
var EventEmitter = require('eventemitter3')
var logger = require('./lib/util/log')(module)
var routes = require('./lib/routes')
var eventHandlers = require('./lib/event-handlers')
var PrimusHandler = require('./lib/primus-handlers')
var User = require('./lib/models/user')
var Project = require('./lib/models/project')
var mongoose = require('mongoose')

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
primus.authorize(auth.primusJwtAuth)
server.primus = primus

var emitter = new EventEmitter()
eventHandlers(emitter, primus)

var hapiPlugins = [
  hapiAuthBasic, hapiAuthJWT,
  {
    register: good,
    options: {
      reporters: [{
        reporter: require('good-console'),
        events: { log: ['error', 'medium'], error: '*' }
      }]
    }
  }
]
server.register(hapiPlugins, function (err) {
  if (err) {
    return console.error(err)
  }
  // Basic auth for drones
  server.auth.strategy('droneBasicAuth', 'basic', { validateFunc: auth.droneBasicAuth })
  // Basic auth for users
  server.auth.strategy('userBasicAuth', 'basic', { validateFunc: auth.userBasicAuth })
  // JWT for drones, users and API calls (using user token)
  server.auth.strategy('jwtAuth', 'jwt', {
    key: config.jwtSecret,
    validateFunc: auth.jwtAuth,
    verifyOptions: { algorithms: [ 'HS256' ] }
  })

  server.auth.default('jwtAuth')
  var routeList = routes(emitter)
  server.route(routeList)
})

// Setup on first start
setUpAdminUser()
setUpDefaultProject()

if (!module.parent) {
  server.start(function (err) {
    if (err) {
      return console.error(err)
    }

    if (!(process.env.STRIDER_ADMIN_USER) || !(process.env.STRIDER_ADMIN_PWD)) {
      logger.warn('WARNING: using default admin user name and password')
    }

    logger.info('Server started ' + server.info.uri)
  })
}

function setUpAdminUser () {
  var salt = bcrypt.genSaltSync(10)
  var admin = {
    name: config.adminUser,
    secret: bcrypt.hashSync(config.adminPwd, salt),
    role: 'admin',
    projects: ['default'],
    session: {}
  }
  if (config.dbType === 'mongodb') {
    require('deasync').loopWhile(function () {
      return mongoose.connection.readyState !== 1
    })
    if (config.clearDB) {
      mongoose.connection.db.dropDatabase()
      mongoose.disconnect()
      mongoose.connect(config.mongoDbURI)
    }
    require('deasync').loopWhile(function () {
      return mongoose.connection.readyState !== 1
    })
  }
  User.findByQuery({name: config.adminUser}).then(function (list) {
    if (list.length === 0) {
      User.save(admin).then(function (id) {
        logger.info('created admin user with id ' + id)
        global.striderReady = true
      }).then(null, function (err) {
        logger.warn('failed to create admin user ' + err)
      })
    } else {
      logger.warn('admin user exists and will not be replaced!')
      global.striderReady = true
    }
  })
}

function setUpDefaultProject () {
  var project = {
    name: config.defaultProjectName,
    id: config.defaultProjectId,
    environments: [],
    provider: {
      type: 'github'
    }
  }
  if (config.dbType === 'mongodb') {
    require('deasync').loopWhile(function () {
      return mongoose.connection.readyState !== 1
    })
    if (config.clearDB) {
      mongoose.connection.db.dropDatabase()
      mongoose.disconnect()
      mongoose.connect(config.mongoDbURI)
    }
    require('deasync').loopWhile(function () {
      return mongoose.connection.readyState !== 1
    })
  }
  Project.findByQuery({name: config.defaultProjectName}).then(function (list) {
    if (list.length === 0) {
      Project.save(project).then(function (id) {
        logger.info('created default project with id ' + id)
      }).then(null, function (err) {
        logger.warn('failed to create admin user ' + err)
      })
    } else {
      logger.warn('default project exists and will not be replaced!')
    }
  })
}

module.exports = server
