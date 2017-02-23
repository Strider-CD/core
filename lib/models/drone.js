'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var MongooseCollection = require('./mongoose-collection')
var config = require('config')
var schema = Joi.object().keys({
  id: Joi.string().required(),
  name: Joi.string().required(),
  token: Joi.string(),
  location: Joi.string(),
  status: Joi.string().only(['inactive', 'active', 'broken']),
  platform: Joi.string().only(['darwin', 'linux', 'windows']),
  session: Joi.object().keys({})
})

class DroneCollection extends SimpleCollection {
  static schema = schema
  schema = schema
}

class DroneCollectionMongoose extends MongooseCollection {
  static schema = schema
  schema = schema
}

if (config.dbType === 'mongodb') {
  module.exports = DroneCollectionMongoose;
} else {
  module.exports = DroneCollection;
}
