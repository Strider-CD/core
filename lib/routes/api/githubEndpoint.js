var config = require('config')
var senecaForwarder = require('../../senecaForwarder.js')

module.exports = function () {
  var forwarder = senecaForwarder.bind(undefined, 'github')
  return [{
    path: config.apiPrefix + 'github',
    method: 'POST',
    handler: function (request, reply) {
      forwarder('handleWebhook',
        {
          'event': request.headers['x-github-event'],
          action: request.payload.action,
          data: stripPayloadFromRequest(request)
        }
        , function (err, results) {
          if (err) reply('').code(503) // Service Unavailable
          else reply('')
        })
    }
  }]
}

function stripPayloadFromRequest (request) {
  var event = request.headers['x-github-event']
  var payload = request.payload[event]
  var trigger = {
    action: request.payload.action,
    author: {
      username: payload.user.login,
      image: payload.user.avatar_url
    },
    url: payload.html_url,
    message: payload.title,
    timestamp: payload.updated_at,
    source: {
      type: 'plugin',
      plugin: 'github'
    }
  }
  return {
    branch: payload.base.ref,
    trigger: trigger,
    deploy: false,
    ref: {
      fetch: 'refs/pull/' + payload.number + '/merge'
    },
    plugin_data: {
      github: {
        pull_request: {
          user: payload.head.repo.owner.login,
          repo: payload.head.repo.name,
          sha: payload.head.sha,
          number: payload.number
        }
      }
    }
  }
}
