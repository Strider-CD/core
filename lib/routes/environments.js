'use strict'

import config from 'config'
import web from 'hapi-decorators'
import Environment from '../models/environment'
var basePath = config.apiPrefix + 'environments'

@web.controller(basePath)
class Environments {
  /**
   * Returns all environments
   */
  @web.get('/')
  all (request, reply) {
    Environment.findByQuery({}).then(function (items) {
      reply(items)
    }).catch(function (error) {
      reply(error).code(400)
    })
  }

  @web.post('/')
  create (request, reply) {
    var payload = request.payload

    if (!(payload.name)) {
      return reply('malformed request').code(400)
    }

    Environment.save(payload).then(function (id) {
      reply(id)
    })
    .catch(error => reply(error).code(500))
  }
}

export default Environments
