var Bcrypt = require('bcrypt')
var Drone = require('../models/drone')
var User = require('../models/user')

module.exports = {
  droneBasicAuth: function (request, name, secret, callback) {
    Drone.findByQuery({'name': name}).then(function (list) {
      if (list.length < 1) {
        return callback(null, false)
      }

      let drone = list[0]
      Bcrypt.compare(secret, drone.secret, function (err, isValid) {
        return callback(err, isValid, { id: drone.id, name: drone.name })
      })
    }).catch(function (err) {
      return callback(err, false)
    })
  },

  userBasicAuth: function (request, name, secret, callback) {
    User.findByQuery({'name': name}).then(function (list) {
      if (list.length < 1) {
        return callback(null, false)
      }

      let user = list[0]
      Bcrypt.compare(secret, user.secret, function (err, isValid) {
        return callback(err, isValid, { id: user.id, name: user.name })
      })
    }).catch(function (err) {
      return callback(err, false)
    })
  },

  jwtAuth: function (decoded, request, callback) {
    if (decoded.type === 'drone') {
      droneJwtAuth(decoded, request, callback)
    } else if (decoded.type === 'user') {
      userJwtAuth(decoded, request, callback)
    }
  }
}

function droneJwtAuth (decoded, request, callback) {
  Drone.findByQuery({'session.id': decoded.id}).then(function (list) {
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
      }).catch(function (err) {
        return callback(err, false)
      })
    } else {
      // session still alive
      return callback(null, true)
    }
  }).catch(function (err) {
    callback(err, false)
  })
}

function userJwtAuth (decoded, request, callback) {
  User.findByQuery({'session.id': decoded.id}).then(function (list) {
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
      }).catch(function (err) {
        return callback(err, false)
      })
    } else {
      // session still alive
      return callback(null, true)
    }
  }).catch(function (err) {
    callback(err, false)
  })
}
