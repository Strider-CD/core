module.exports = function (options) {
  var seneca = this
  seneca.use('lib/microservices/droneManagement')
  return 'microservices'
}
