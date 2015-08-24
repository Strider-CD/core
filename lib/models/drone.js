'use strict'

var SimpleCollection = require('./simpleCollection')
var collectionSingleton = Symbol()
var DroneSchema = {
  title: 'Generic Drone Schema',
  type: 'object',
  properties: {
    id: { type: 'string' }
  }
}

class Drone {
  constructor () {}

  static collection () {
    if (!this[collectionSingleton]) {
      this[collectionSingleton] = new DroneCollection(DroneSchema)
    }
    return this[collectionSingleton]
  }

  static destroyCollection () {
    this[collectionSingleton] = null
  }
}

class DroneCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}

exports.Drone = Drone
exports.DroneSchema = DroneSchema
