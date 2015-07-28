var droneManagement = require('./droneManagement.js')

module.exports = function () {
  return [].concat(droneManagement())
}
