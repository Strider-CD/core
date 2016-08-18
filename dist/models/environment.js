'use strict';

var Joi = require('joi');
var SimpleCollection = require('./simple-collection');
var droneSchema = require('./drone').schema;
var jobSchema = require('./job').schema;
var schema = Joi.object().keys({
  id: Joi.string().required(),
  name: Joi.string().required(),
  isActive: Joi.boolean(),
  jobQueue: Joi.array().items(jobSchema),
  drones: Joi.array().items(droneSchema),
  requirements: Joi.object().keys({
    platform: Joi.string().only(['darwin', 'linux', 'windows']),
    languages: Joi.array().items(Joi.string()),
    plugins: Joi.array().items(Joi.string())
  }),
  triggers: Joi.array().items(Joi.object().keys({
    type: Joi.string().only(['branch', 'tag']),
    includePattern: Joi.string(),
    triggers: Joi.array().when('type', {
      is: 'branch',
      then: Joi.array().only(['pull-request', 'push-commit']),
      otherwise: Joi.array().only(['create-tag'])
    })
  }))
});

let EnvironmentCollection = class EnvironmentCollection extends SimpleCollection {};


module.exports = new EnvironmentCollection(schema);
//# sourceMappingURL=environment.js.map