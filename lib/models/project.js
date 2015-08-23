'use strict'

var SimpleCollection = require('./simpleCollection.js')
var collectionSingleton = Symbol()
var Schema = {
  title: 'Generic Project Schema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    environments: { type: 'array' },
    provider: { type: 'object' }
  },
  required: ['id', 'provider']
}

class Project {
  constructor() {}

  static collection () {
    if (!this[collectionSingleton]) {
      this[collectionSingleton] = new ProjectsCollection(Schema)
    }
    return this[collectionSingleton]
  }

  static purgeCollection () {
    if (this[collectionSingleton]) {
      this[collectionSingleton].purge()
    }
  }
}

class ProjectsCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

exports.Project = Project
exports.Schema = Schema
