'use strict'

var Joi = require('joi')
var uuid = require('node-uuid')
var v = require('validator')
var Promise = require('bluebird')
var Loki = require('lokijs')
var prettyJson = require('../util/prettyPrint.js')
var logger = require('../util/log.js')(module)

class SimpleCollection {
  constructor (schema) {
    this.schema = schema // a joi schema
    this.db = new Loki(`${this.constructor.name}.json`)
    this.col = this.db.addCollection(this.constructor.name)
  }

  save (item) {
    if (!(v.isUUID(item.id))) {
      item.id = uuid.v1() // date time based ids
    }

    var validation = this.validate(item, this.schema.optionalKeys('id'))

    if (!validation.error) {
      this.col.insert(item)
      return Promise.resolve(item.id)
    } else {
      let errorMsg = `${this.constructor.name}.save() item failed to validate`

      return Promise.reject({
        message: errorMsg,
        details: validation.error
      })
    }
  }

  update (id, item) {
    // var validation = this.validate(item, this.schema.optionalKeys('id'))
    var errorMsg = `${this.constructor.name}.save() item failed to update: ${prettyJson(item)}`
    var res = this.col.findOne({'id': id})

    if (res) {
      // copy meta information from 'old' entry
      Object.assign(res, item)

      try {
        this.col.update(res)
      } catch (err) {}

      return Promise.resolve(res.id)
    }

    return Promise.reject(errorMsg)
  }

  findOneById (id) {
    var res = this.col.findOne({'id': id})
    if (res) {
      return Promise.resolve(res)
    }

    var errorMsg = `${this.constructor.name}.findOneById() item not found: ${id}`
    return Promise.reject({ message: errorMsg, code: 404 })
  }

  findOneByQuery (query) {
    var res = this.col.findOne(query)

    if (res) {
      return Promise.resolve(res)
    }

    var errorMsg = `${this.constructor.name}.findOneById() item not found: ${prettyJson(query)}`
    return Promise.reject({ message: errorMsg })
  }

  findById (id) {
    var res = this.col.find({'id': id})

    if (res) {
      if (res.length > 0) return Promise.resolve(res)
    }

    var errorMsg = `${this.constructor.name}.findOneById() item not found: ${id}`
    return Promise.reject({ message: errorMsg })
  }

  findByQuery (query) {
    var res = this.col.find(query)

    if (res) {
      return Promise.resolve(res)
    }

    var errorMsg = `${this.constructor.name}.findByQuery() item not found`

    return Promise.reject({ message: errorMsg })
  }

  remove (item) {
    this.col.remove(item)
    return Promise.resolve()
  }

  purge () {
    this.col.removeDataOnly()
  }

  validate (item, optionalSchema) {
    var validateOptions = {
      allowUnknown: true
    }
    var validation

    if (optionalSchema) {
      validation = Joi.validate(item, optionalSchema, validateOptions)
    } else {
      validation = Joi.validate(item, this.schema, validateOptions)
    }

    if (validation.error) logger.debug(validation.error)

    return validation
  }
}

module.exports = SimpleCollection
