var winston = require('winston')
var prettyPrint = require('./prettyPrint.js')

module.exports = function (module) {
  var filename = module.id
  return {
    info: function (msg, vars) {
      if (vars) winston.info('[' + filename + ']' + ': ' + msg, prettyPrint(vars))
      else  winston.info('[' + filename + ']' + ': ' + msg)
    },
    warn: function (msg, vars) {
      if (vars) winston.warn('[' + filename + ']' + ': ' + msg, prettyPrint(vars))
      else  winston.warn('[' + filename + ']' + ': ' + msg)
    },
    debug: function (msg, vars) {
      if (vars) winston.debug('[' + filename + ']' + ': ' + msg, prettyPrint(vars))
      else winston.debug('[' + filename + ']' + ': ' + msg)
    }
  }
}
