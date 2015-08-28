'use strict'

var SimpleCollection = require('./simpleCollection.js')

let JobSchema = {
  'title': 'Generic Job Schema',
  'type': 'object',
  'properties': {
    'id': { 'type': 'string' },
    'hasChildren': {'type': 'boolean'},
    'children': {'type': 'object'},
    'parrent': {'type': 'string'},
    'status': { 'type': 'string',
      'enum': ['received', 'running', 'finished', 'aborted', 'restarted']
    },
    'result': { 'type': 'string',
      'enum': ['pending', 'failed', 'success']
    },
    'stdout': { 'type': 'string'},
    'stderr': { 'type': 'string'},
    'trigger': { 'type': 'string',
      'enum': ['github', 'gitlab', 'rest']
    },
    'triggerInfo': { 'type': 'object'} // github pr refs, rest user info etc.
  },
  'required': ['status', 'hasChildren', 'result', 'stdout', 'stderr',
    'trigger', 'triggerInfo', 'hasChildren', 'children', 'parrent']
}

let collectionSingleton = Symbol()
class Job {
  constructor () {}

  static collection () {
    if (!this[collectionSingleton]) {
      this[collectionSingleton] = new jobsCollection(JobSchema)
    }
    return this[collectionSingleton]
  }

  static purgeCollection () {
    if (this[collectionSingleton]) {
      this[collectionSingleton].purge()
    }
  }
}

class jobsCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

exports.Job = Job
exports.JobSchema = JobSchema
