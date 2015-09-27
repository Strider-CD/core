'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var MongooseCollection = require('./mongoose-collection')
var config = require('config')
var schema = Joi.object().keys({
  id: Joi.string(),
  name: Joi.string().required(),
  session: Joi.object().keys({
  })
})

class DroneCollectionLoki extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

class DroneCollectionMongoose extends MongooseCollection {
  constructor (schema) {
    super(schema)
  }
}

if (config.dbType === 'mongodb') {
  module.exports = new DroneCollectionMongoose(schema)
} else {
  module.exports = new DroneCollectionLoki(schema)
}
