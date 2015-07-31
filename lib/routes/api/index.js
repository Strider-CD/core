var droneManagement = require('./droneManagement.js')
var githubEndpoint = require('./githubEndpoint.js')

module.exports = function () {
  return [].concat(droneManagement(), githubEndpoint())
}
