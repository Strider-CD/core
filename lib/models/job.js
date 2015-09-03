'use strict'

var Joi = require('joi')
var SimpleCollection = require('./simple-collection')
var schema = Joi.object().keys({
  id: Joi.string().required(),
  hasChildren: Joi.boolean().required(),
  children: Joi.object().required(),
  parent: Joi.string().allow('').required(),
  status: Joi.string().only([
    'received', 'running', 'finished', 'aborted', 'restarted'
  ]).required(),
  result: Joi.string().only([
    'pending', 'failed', 'success'
  ]).required(),
  stdout: Joi.string().allow('').required(),
  stderr: Joi.string().allow('').required(),
  trigger: Joi.string().only([
    'github', 'gitlab', 'rest'
  ]).required(),
  triggerInfo: Joi.object().required() // github pr refs, rest user info etc.
})

class JobsCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new JobsCollection(schema)
