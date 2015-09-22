'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var schema = Joi.object().keys({
  id: Joi.string(),
  name: Joi.string().required(),
  secret: Joi.string().required(),
  session: Joi.object().keys({
    id: Joi.string(),
    valid: Joi.boolean(),
    exp: Joi.number()
  })
})

class DroneCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new DroneCollection(schema)
