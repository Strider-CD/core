'use strict'

var config = require('config')
var github = require('./github')
var jobs = require('./jobs')
var mongoose = require('./mongoose')

module.exports = function (emitter, client) {
  github(emitter, client)
  jobs(emitter, client)
  if (config.dbType === 'mongodb') {
    mongoose(emitter)
  }
}
