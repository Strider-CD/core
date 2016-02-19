var winston = require('winston')
var prettyPrint = require('./prettyPrint.js')

module.exports = function (module) {
  var filename = module.id
  return {
    info (msg, vars) {
      if (vars) winston.info('[' + filename + ']' + ': ' + msg, prettyPrint(vars))
      else winston.info('[' + filename + ']' + ': ' + msg)
    },
    warn (msg, vars) {
      if (vars) winston.warn('[' + filename + ']' + ': ' + msg, prettyPrint(vars))
      else winston.warn('[' + filename + ']' + ': ' + msg)
    },
    debug (msg, vars) {
      if (vars) winston.debug('[' + filename + ']' + ': ' + msg, prettyPrint(vars))
      else winston.debug('[' + filename + ']' + ': ' + msg)
    }
  }
}
