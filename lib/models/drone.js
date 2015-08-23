'use strict'

var SimpleCollection = require('./simpleCollection.js')

let DroneSchema = {
  'title': 'Generic Drone Schema',
  'type': 'object',
  'properties': {
    'id': { 'type': 'string' }
  }
}

let collectionSingleton = Symbol()
class Drone {
  constructor () {}

  static collection () {
    if (!this[collectionSingleton]) {
      this[collectionSingleton] = new droneCollection(DroneSchema)
    }
    return this[collectionSingleton]
  }

  static destroyCollection () {
    this[collectionSingleton] = null
  }
}

class droneCollection extends SimpleCollection {
  constructor (schema) {
    super(schema)
  }
}
exports.Drone = Drone
exports.DroneSchma = DroneSchema
