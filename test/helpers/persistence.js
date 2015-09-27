var mongoose = require('mongoose')
var config = require('config')

var tape = null
if (config.dbType === 'mongodb') {
  require('deasync').loopWhile(function () {
    return !global.striderReady
  })
  mongoose.disconnect()
  require('deasync').loopWhile(function () {
    return mongoose.connection.readyState !== 0
  })

  var redtape = require('redtape')
  tape = redtape({
    beforeEach: function (cb) {
      mongoose.connect(config.mongoDbURI)
      require('deasync').loopWhile(function () {
        return mongoose.connection.readyState !== 1
      })
      cb()
    },
    afterEach: function (cb) {
      mongoose.disconnect()
      require('deasync').loopWhile(function () {
        return mongoose.connection.readyState !== 0
      })
      cb()
    }
  })
} else {
  tape = require('tape')
}

module.exports = tape
