var seneca = require('seneca')()

module.exports = function (role, action, payload, callback) {
  seneca
    .client()
    .act('role:' + role + ',' + 'cmd:' + action, payload, callback)
}
