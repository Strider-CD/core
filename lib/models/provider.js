'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var schema = Joi.object().keys({
  type: Joi.string().only(['github', 'bitbucket', 'gitlab'])
})

class ProviderCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new ProviderCollection(schema)
