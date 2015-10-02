'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var schema = Joi.object().keys({
  id: Joi.string(),
  name: Joi.string().required(),
  secret: Joi.string(),
  role: Joi.string().only([
    'user', 'admin', 'guest'
  ]).required(),
  projects: Joi.array().items(Joi.string()).required()
})

class UserCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new UserCollection(schema)
