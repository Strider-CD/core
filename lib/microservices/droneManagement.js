module.exports = function (options) {
  var seneca = this
  seneca.add({role: 'drones', cmd: 'get'}, get_drones)
  seneca.add({role: 'drones', cmd: 'register'}, register_drone)
  seneca.add({role: 'drones', cmd: 'checkin'}, checkIn_drone)

  function get_drones (data, done) {
    var drones = seneca.make('drones')
    drones.list$(function (err, list) {
      if (err) done(null, {})
      else done(null, list)
    })
  }

  function register_drone (data, done) {
    var drones = seneca.make('drones')
    drones.name = data.name
    drones.save$(function (err, drone) {
      if (err) done(err, {})
      else done(null, {id: drone.id, name: drone.name})
    })
  }

  function checkIn_drone (data, done) {
    var drones = seneca.make('drones')
    drones.data = data.data
    drones.save$(function (err, drone) {
      if (err) done(null, {})
      else done(null, {id: data.id, onPostAuth: true, status: 'ready' })
    })
  }

  return 'droneManagement'
}
