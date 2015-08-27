'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var providerSchema = require('./provider').schema
var schema = Joi.object().keys({
  id: Joi.string().required(),
  environments: Joi.array(),
  provider: providerSchema.required()
})

class ProjectsCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new ProjectsCollection(schema)
