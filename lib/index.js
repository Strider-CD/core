import Hapi from 'hapi'
import hapiAuthBasic from 'hapi-auth-basic'
import hapiAuthJWT from 'hapi-auth-jwt2'
import hapiAsyncHandler from 'hapi-async-handler'
import good from 'good'
import bcrypt from 'bcryptjs'
import config from 'config'
import mongoose from 'mongoose'
import EventEmitter from 'eventemitter3'
import auth from './auth'
import setupLogger from './util/log'
import routes from './routes'
import eventHandlers from './event-handlers'
import PrimusHandler from './primus-handlers'
import User from './models/user'
import Project from './models/project'

const logger = setupLogger(module)
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
  hapiAuthBasic,
  hapiAuthJWT,
  hapiAsyncHandler,
  {
    register: good,
    options: {
      reporters: {
        console: [{
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [{
            log: '*',
            response: '*'
          }]
        }, {
          module: 'good-console'
        }, 'stdout']
      }
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
