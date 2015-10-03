'use strict'

var Joi = require('joi')
var MongooseCollection = require('./mongoose-collection')
var config = require('config')
var SimpleCollection = require('./simple-collection')
var schema = Joi.object().keys({
  id: Joi.string(),
  project_id: Joi.string(),
  hasChildren: Joi.boolean().required(),
  children: Joi.object().keys({}).required(),
  parent: Joi.string().allow('').required(),
  status: Joi.string().only([
    'received', 'running', 'finished', 'aborted', 'restarted'
  ]).required(),
  result: Joi.string().only([
    'pending', 'failed', 'success'
  ]).required(),
  stdout: Joi.object().keys({}).required(),
  stderr: Joi.object().keys({}).required(),
  trigger: Joi.string().only([
    'github', 'gitlab', 'rest'
  ]).required(),
  receivedAt: Joi.number(),
  updatedAt: Joi.number(),
  runningSince: Joi.number(),
  triggerInfo: Joi.object().keys({}).required() // github pr refs, rest user info etc.
})

class JobsCollectionLoki extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

class JobsCollectionMongoose extends MongooseCollection {
  constructor (schema) {
    super(schema)
  }
}

if (config.dbType === 'mongodb') {
  module.exports = new JobsCollectionMongoose(schema)
} else {
  module.exports = new JobsCollectionLoki(schema)
}
