'use strict'

var Joi = require('joi')
var uuid = require('node-uuid')
var v = require('validator')
var Promise = require('bluebird')
var prettyJson = require('../util/prettyPrint.js')
var mongoose = require('mongoose')
var joigoose = require('joigoose')(mongoose)
var logger = require('../util/log.js')(module)
var flat = require('flat')

class MongooseCollection {
  constructor (schema) {
    this.schema = schema // a joi schema
    this.mongooseSchema = joigoose.convert(this.schema)
    this.collectionName = this.modelName(this.constructor.name)
    this.model = mongoose.model(`${this.constructor.name}`, this.mongooseSchema)
    this.model.schema.pre('findOneAndUpdate', function () {
      this._update = flat(this._update)
    })
  }

  save (item) {
    if (!(v.isUUID(item.id))) {
      item.id = uuid.v1() // date time based ids
    }

    var validation = this.validate(item, this.schema.optionalKeys('id'))

    if (!validation.error) {
      var self = this
      return new Promise(function (resolve, reject) {
        self.model.collection.insert(item, function (err, reply) {
          if (err) {
            let errorMsg = `${self.constructor.name}.save() item failed to save`
            return reject({
              message: errorMsg,
              details: err
            })
          }
          return resolve(item.id)
        })
      })
    } else {
      let errorMsg = `${self.constructor.name}.save() item failed to validate`
      return Promise.reject({
        message: errorMsg,
        details: validation.error
      })
    }
  }

  update (id, item) {
    var validation = this.validate(item)
    let errorMsg = `${this.constructor.name}.save() item failed to update: ${prettyJson(item)}`
    if (validation.error) {
      return Promise.reject({
        message: errorMsg,
        details: validation.error
      })
    }
    var self = this
    return self.model.findOne({'id': id}).lean().then(function (res) {
      Object.assign(res, item)
      return self.model.update({'id': id}, res).lean().then(function (raw) {
        return Promise.resolve(res.id)
      }).then(null, function (err) {
        return Promise.reject({
          message: errorMsg,
          details: err
        })
      })
    }).then(null, function (err) {
      return Promise.reject({
        message: errorMsg,
        details: err
      })
    })
  }

  findOneById (id) {
    return this.findOneByQuery({'id': id})
  }

  findOneByQuery (query) {
    let errorMsg = `${this.constructor.name}.findOneByQuery() item not found for: ${query}`
    return this.model.findOne(query).lean().then(function (res) {
      if (res) {
        return Promise.resolve(res)
      }
    }).then(null, function (err) {
      return Promise.reject({
        message: errorMsg,
        detail: err
      })
    })
  }

  findById (id) {
    return this.findByQuery({'id': id})
  }

  findByQuery (query) {
    let errorMsg = `${this.constructor.name}.findByQuery() items not found for: ${query}`
    return this.model.find(query).lean().then(function (res) {
      if (res) {
        return Promise.resolve(res)
      }
    }).then(null, function (err) {
      return Promise.reject({
        message: errorMsg,
        detail: err
      })
    })
  }

  remove (item) {
    this.model.remove({'id': item.id}).exec()
    return Promise.resolve()
  }

  purge () {
    mongoose.connection.collections[this.collectionName].drop()
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

  modelName (name) {
    return name.toLowerCase() + 's'
  }
}

module.exports = MongooseCollection
