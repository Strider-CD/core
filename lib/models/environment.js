'use strict'

var SimpleCollection = require('./simple-collection')
var droneSchema = require('./drone').schema
var jobSchema = require('./job').schema
var Schema = {
  title: 'Generic Environment Schema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    isActive: { type: 'boolean' },
    jobQueue: { type: 'array', items: jobSchema },
    drones: { type: 'array', items: droneSchema },
    triggers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string', enum: ['branch', 'tag'] },
          sourcePattern: { type: 'string' },
          triggers: { type: 'array', enum: ['pull-request', 'push-commit', 'create-tag'] }
        }
      }
    }
  }
}

class EnvironmentCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new EnvironmentCollection(Schema)
