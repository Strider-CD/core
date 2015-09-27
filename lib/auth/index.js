var Bcrypt = require('bcrypt')
var Drone = require('../models/drone')
var User = require('../models/user')
var jwt = require('jwt-simple')
var uuid = require('node-uuid')
var config = require('config')
var logger = require('../util/log.js')(module)

function droneBasicAuth (request, name, secret, callback) {
  Drone.findByQuery({'name': name}).then(function (list) {
    if (list.length < 1) {
      return callback(null, false)
    }

    let drone = list[0]
    Bcrypt.compare(secret, drone.secret, function (err, isValid) {
      return callback(err, isValid, { id: drone.id, name: drone.name })
    })
  }).then(null, function (err) {
    return callback(err, false)
  })
}

function userBasicAuth (request, name, secret, callback) {
  if (name === 'guest') {
    return callback(null, true, { id: uuid.v1(), name: 'guest' })
  }
  User.findByQuery({'name': name}).then(function (list) {
    if (list.length < 1) {
      return callback(null, false)
    }

    let user = list[0]
    Bcrypt.compare(secret, user.secret, function (err, isValid) {
      return callback(err, isValid, { id: user.id, name: user.name })
    })
  }).then(null, function (err) {
    return callback(err, false)
  })
}

function jwtAuth (decoded, request, callback) {
  if (decoded.type === 'drone') {
    return droneJwtAuth(decoded, request, callback)
  } else if (decoded.type === 'user') {
    return userJwtAuth(decoded, request, callback)
  } else if (decoded.type === 'guest') {
    return guestJwtAuth(decoded, request, callback)
  } else {
    return callback(new Error('auth unknown type ' + decoded.type), false)
  }
}

function primusJwtAuth (req, authorized) {
  var token = req.query.token
  var error
  var payload

  if (!token) {
    error = new Error('Missing access token')
    console.error(error.message)
    return authorized(error)
  }
  try {
    payload = jwt.decode(token, config.jwtSecret)
  } catch (e) {
    return authorized(e)
  }

  jwtAuth(payload, req, function (error, success) {
    if (error) return authorized(error)
    if (!(success)) {
      error = new Error('primusJwtAuth: Invalid access token')
      console.error(error.message)
      return authorized(error)
    } else {
      req.decoded_token = payload
      authorized()
    }
  })
}

function droneJwtAuth (decoded, request, callback) {
  Drone.findByQuery({'id': decoded.parent}).then(function (list) {
    if (list.length < 1) return callback(null, false)
    var drone = list[0]
    let valid = drone.session.valid
    let exp = drone.session.exp
    if (valid !== decoded.valid || exp !== decoded.exp) {
      return callback(null, false)
    }
    if (exp < new Date().getTime() || !(valid)) {
      drone.session = undefined
      Drone.update(drone.id, drone).then(function (id) {
        return callback('token no longer valid', false)
      }).then(null, function (err) {
        return callback(err, false)
      })
    } else {
      // session still alive
      return callback(null, true, decoded)
    }
  }).then(null, function (err) {
    callback(err, false)
  })
}

function userJwtAuth (decoded, request, callback) {
  User.findByQuery({'id': decoded.parent}).then(function (list) {
    if (list.length < 1) return callback(null, false)
    var user = list[0]
    let valid = user.session.valid
    let exp = user.session.exp
    if (valid !== decoded.valid || exp !== decoded.exp) {
      return callback(null, false)
    }
    if (exp < new Date().getTime() || !(valid)) {
      user.session = undefined
      User.update(user.id, user).then(function (id) {
        return callback('token no longer valid', false)
      }).then(null, function (err) {
        logger.debug(err)
        return callback(err, false)
      })
    } else {
      // session still alive
      return callback(null, true, decoded)
    }
  }).then(null, function (err) {
    console.error(err)
    callback(err, false)
  })
}

function guestJwtAuth (decoded, request, callback) {
  if (!(request.method === 'get' || request.method === 'GET')) {
    logger.warn('Guest user tried to use a http method other than "get"!')
  }
  if (decoded.exp > new Date().getTime() && decoded.valid) {
    return callback(null, true)
  } else {
    return callback(new Error('Guest token no longer valid'), false)
  }
}

module.exports = {
  droneBasicAuth: droneBasicAuth,
  userBasicAuth: userBasicAuth,
  jwtAuth: jwtAuth,
  primusJwtAuth: primusJwtAuth
}
