'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var MongooseCollection = require('./mongoose-collection')
var config = require('config')
var providerSchema = require('./provider').schema
var schema = Joi.object().keys({
  id: Joi.string(),
  name: Joi.string().required(),
  environments: Joi.array(),
  provider: providerSchema.required()
})

class ProjectsCollectionLoki extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

class ProjectsCollectionMongoose extends MongooseCollection {
  constructor (schema) {
    super(schema)
  }
}

if (config.dbType === 'mongodb') {
  module.exports = new ProjectsCollectionMongoose(schema)
} else {
  module.exports = new ProjectsCollectionLoki(schema)
}
