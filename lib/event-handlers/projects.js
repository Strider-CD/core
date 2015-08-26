'use strict'

var Project = require('../models/project')

module.exports = function (emitter) {
  emitter.on('projects.get', get)

  function get (query, cb) {
    var projectQuery = query || {}

    Project.findByQuery(projectQuery).then(function (list) {
      cb(undefined, list)
    }).catch(function (err) {
      cb(err)
    })
  }
}
