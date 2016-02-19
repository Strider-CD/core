'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var MongooseCollection = require('./mongoose-collection')
var config = require('config')
var schema = Joi.object().keys({
  id: Joi.string().required(),
  name: Joi.string().required(),
  location: Joi.string(),
  status: Joi.string(),
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
