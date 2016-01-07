'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var droneSchema = require('./drone').schema
var jobSchema = require('./job').schema
var schema = Joi.object().keys({
  id: Joi.string().required(),
  name: Joi.string().required(),
  isActive: Joi.boolean(),
  jobQueue: Joi.array().items(jobSchema),
  drones: Joi.array().items(droneSchema),
  triggers: Joi.array().items(
    Joi.object.keys({
      source: Joi.string().only(['branch', 'tag']),
      sourcePattern: Joi.string(),
      triggers: Joi.array().only([
        'pull-request', 'push-commit', 'create-tag'
      ])
    })
  )
})

class EnvironmentCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new EnvironmentCollection(schema)
