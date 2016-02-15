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
}

export default Environments
