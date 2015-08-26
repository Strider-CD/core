'use strict'

var lodash = require('lodash')
var Job = require('../models/job')

module.exports = function (emitter) {
  emitter.on('jobs.find', find)
  emitter.on('jobs.job.update', jobUpdate)
  emitter.on('jobs.job.stop', jobStop)
  emitter.on('jobs.queue.get', queueGet)
  emitter.on('jobs.queue.insert', queueInsert)

  function find (query, cb) {
    var jobQuery = query || {}
    Job.findByQuery(jobQuery).then(function (list) {
      cb(null, list)
    }).catch(function (err) {
      cb(err, {})
    })
  }

  function jobUpdate (job, cb) {
    Job.findOneById(job.id).then(function (foundJob) {
      Object.assign(foundJob, job)

      job.updatedAt = new Date().getTime()
      Job.update(foundJob.id, foundJob).then(function (id) {
        cb(undefined, id)
        return
      }).catch(function (err) {
        cb(err)
        return
      })
    }).catch(function (err) {
      cb(err)
      return
    })
  }

  function queueGet (cb) {
    var query = { status: 'received' }

    find(query, function (err, list) {
      if (err) {
        cb(err, undefined)
        return
      }

      if (list.length > 0) {
        let job = lodash.sortBy(list, jobItem => jobItem.updatedAt)[0]

        job.status = 'running'

        jobUpdate(job, function (err, id) {
          cb(err, job)
          return
        })
      } else {
        cb(err, '')
        return
      }
    })
  }

  function queueInsert (job, cb) {
    job.status = 'received'
    job.updatedAt = new Date().getTime()

    Job.save(job).then(function (id) {
      cb(undefined, id)
    }).catch(function (err) {
      cb(err)
    })
  }

  function jobStop (job, cb) {
    job.status = 'aborted'
    job.updatedAt = new Date().getTime()

    Job.save(job).then(function (id) {
      cb(undefined, id)
    }).catch(function (err) {
      cb(err)
    })
  }
}
