'use strict'

var Project = require('../models/project')

module.exports = function (emitter) {
  emitter.on('projects.get', get)
  emitter.on('projects.create', create)

  function get (query, cb) {
    var projectQuery = query || {}

    Project.findByQuery(projectQuery).then(function (list) {
      cb(undefined, list)
    }).catch(function (err) {
      cb(err)
    })
  }

  function create (project, cb) {
    Project.save(project).then(id => {
      cb(undefined, id)
    }).catch(err => cb(err))
  }
}
