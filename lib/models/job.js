'use strict'

var SimpleCollection = require('./simple-collection')
var schema = {
  title: 'Generic Job Schema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    hasChildren: { type: 'boolean' },
    children: { type: 'array' },
    status: {
      type: 'string',
      enum: ['received', 'running', 'finished', 'aborted', 'restarted']
    },
    result: {
      type: 'string',
      enum: ['pending', 'failed', 'success']
    },
    stdout: { type: 'string' },
    stderr: { type: 'string' },
    trigger: {
      type: 'string',
      enum: ['github', 'gitlab', 'rest']
    },
    triggerInfo: { type: 'object' } // github pr refs, rest user info etc.
  },
  required: [
    'status', 'result', 'stdout', 'stderr',
    'trigger', 'triggerInfo', 'hasChildren',
    'children'
  ]
}

class JobsCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new JobsCollection(schema)
