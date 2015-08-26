'use strict'

var SimpleCollection = require('./simple-collection')
var DroneSchema = {
  title: 'Generic Drone Schema',
  type: 'object',
  properties: {
    id: { type: 'string' }
  }
}

class DroneCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

module.exports = new DroneCollection(DroneSchema)
