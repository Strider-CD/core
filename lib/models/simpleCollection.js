'use strict'

var uuid = require('node-uuid')
var tv4 = require('tv4')
var Promise = require('bluebird')
var Loki = require('lokijs')
var prettyJson = require('../util/prettyJson.js')

class SimpleCollection {
  constructor (schema) {
    this.schema = schema // a json schema v4
    this.collectionStore = {}
    this.db = new Loki(`${this.constructor.name}.json`)
    this.col = this.db.addCollection(this.constructor.name)
  }

  save (item) {
    item.id = uuid.v1() // date time based ids
    if (this._validate(item)) {
      this.col.insert(item)
      return Promise.resolve(item.id)
    } else {
      var errorMsg = `${this.constructor.name}.save() item failed to validate: ${prettyJson(item)}`
      return Promise.reject(errorMsg)
    }
  }

  update (id, item) {
    if (this._validate(item)) {
      var res = this.col.findOne({'id': id})
      if (res) {
        // copy meta information from 'old' entry
        Object.assign(res, item)
        try {
          this.col.update(res)
        } catch (err) {}
        return Promise.resolve(res.id)
      }
      var errorMsg = `${this.constructor.name}.save() item failed to update: ${prettyJson(item)}`
      return Promise.reject(errorMsg)
    }
  }

  findOneById (id) {
    var res = this.col.findOne({'id': id})
    if (res) {
      return Promise.resolve(res)
    }
    var errorMsg = `${this.constructor.name}.findOneById() item not found: ${id}`
    return Promise.reject(errorMsg)
  }

  findOneByQuery (query) {
    var res = this.col.findOne(query)
    if (res) {
      return Promise.resolve(res)
    }
    var errorMsg = `${this.constructor.name}.findOneById() item not found: ${prettyJson(query)}`
    return Promise.reject(errorMsg)
  }

  findById (id) {
    var res = this.col.find({'id': id})
    if (res) {
      if (res.length > 0) return Promise.resolve(res)
    }
    var errorMsg = `${this.constructor.name}.findOneById() item not found: ${id}`
    return Promise.reject(errorMsg)
  }

  findByQuery (query) {
    var res = this.col.find(query)
    if (res) {
      return Promise.resolve(res)
    }
    var errorMsg = `${this.constructor.name}.findByQuery() item not found: ${prettyJson(query)}`
    return Promise.reject(errorMsg)
  }

  remove (item) {
    this.col.remove(item)
    return Promise.resolve()
  }

  purge () {
    this.col.removeDataOnly()
  }

  _validate (item) {
    return tv4.validate(item, this.schema)
  }
}

module.exports = SimpleCollection
