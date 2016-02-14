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
      type: Joi.string().only(['branch', 'tag']),
      includePattern: Joi.string(),
      triggers: Joi.array().when('type', {
        is: 'branch',
        then: Joi.array().only(['pull-request', 'push-commit']),
        otherwise: Joi.array().only(['create-tag'])
      })
    })
  )
})

class EnvironmentCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new EnvironmentCollection(schema)
