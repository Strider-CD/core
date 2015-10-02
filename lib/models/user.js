'use strict'

var Joi = require('joi')
var config = require('config')
var SimpleCollection = require('./simple-collection')
var MongooseCollection = require('./mongoose-collection')
var schema = Joi.object().keys({
  id: Joi.string(),
  name: Joi.string().required(),
  secret: Joi.string(),
  role: Joi.string().only([
    'user', 'admin', 'guest'
  ]).required(),
  projects: Joi.array().items(Joi.string()).required(),
  session: Joi.object().keys({

  })
})

class UserCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

class UserCollectionMongoose extends MongooseCollection {
  constructor (schema) {
    super(schema)
  }
}

if (config.dbType === 'mongodb') {
  module.exports = new UserCollectionMongoose(schema)
} else {
  module.exports = new UserCollection(schema)
}
