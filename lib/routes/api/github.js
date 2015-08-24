'use strict'

var config = require('config')

module.exports = function (emitter) {
  return [{
    path: config.apiPrefix + 'github',
    method: 'POST',
    handler: function (request, reply) {
      var payload = request.payload
      payload['event'] = request.headers['x-github-event']
      emitter.emit('github.webhooks.handle', payload, function (err, results) {
        if (err) reply('') // Github will never be interested in our status
        else reply('')
      })
    }
  }]
}
