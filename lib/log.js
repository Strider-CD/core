var winston = require('winston')

module.exports = function (module) {
  var filename = module.id
  return {
    info: function (msg, vars) {
      winston.info('[' + filename + ']' + ': ' + msg, vars)
    },
    warn: function (msg, vars) {
      winston.warn('[' + filename + ']' + ': ' + msg, vars)
    },
    debug: function (msg, vars) {
      winston.debug('[' + filename + ']' + ': ' + msg, vars)
    }
  }
}
