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
  status: Joi.string(),
  platform: Joi.string().only(['darwin', 'linux', 'windows']),
  session: Joi.object().keys({})
})

class DroneCollection extends SimpleCollection {
}

class DroneCollectionMongoose extends MongooseCollection {
}

if (config.dbType === 'mongodb') {
  module.exports = new DroneCollectionMongoose(schema)
} else {
  module.exports = new DroneCollection(schema)
}
