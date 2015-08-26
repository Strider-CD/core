'use strict'

var SimpleCollection = require('./simple-collection')
var schema = {
  title: 'Generic Project Schema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    environments: { type: 'array' },
    provider: { type: 'object' }
  },
  required: ['id', 'provider']
}

class ProjectsCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new ProjectsCollection(schema)
