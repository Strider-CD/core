'use strict'

var logger = require('../util/log.js')(module)
var validator = require('validator')
var lodash = require('lodash')
var Job = require('../models/job')

module.exports = function (emitter, client) {
  emitter.on('jobs.find', find)
  emitter.on('jobs.job.update', jobUpdate)
  emitter.on('jobs.job.stop', jobStop)
  emitter.on('jobs.job.changed', jobChanged)
  emitter.on('jobs.queue.get', queueGet)
  emitter.on('jobs.queue.insert', queueInsert)

  function find (query, cb) {
    var jobQuery = query || {}
    Job.findByQuery(jobQuery).then(function (list) {
      cb(undefined, list)
    }).catch(function (err) {
      cb(err)
    })
  }

  function jobUpdate (job, cb) {
    Job.findOneById(job.id).then(function (foundJob) {
      Object.assign(foundJob, job)
      foundJob.updatedAt = new Date().getTime()
      updateParentJob(foundJob)
      emitter.emit('jobs.job.changed', job, function (err, res) {
        if (err) logger.warn('emitting jobs.job.changed failed', err)
      })
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

  function jobStop (job, cb) {
    job.status = 'aborted'
    job.updatedAt = new Date().getTime()
    updateParentJob(job)
    emitter.emit('jobs.job.changed', job, function (err, res) {
      if (err) logger.warn('emitting jobs.job.changed failed', err)
    })
    Job.save(job).then(function (id) {
      cb(null, id)
    }).catch(function (err) {
      cb(err, {})
    })
  }

  function jobChanged (job, cb) {
    client.write({room: 'job.changes', id: job.id, status: job.status, result: job.result, children: job.children})
    cb()
  }

  function queueGet (cb) {
    var query = {'status': 'received'}
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
        emitter.emit('jobs.job.changed', job, function (err, res) {
          if (err) logger.warn('emitting jobs.job.changed failed', err)
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
      job.id = id
      updateParentJob(job)
      emitter.emit('jobs.job.changed', job, function (err, res) {
        if (err) logger.warn('emitting jobs.job.changed failed', err)
      })
      cb(undefined, id)
    }).catch(function (err) {
      cb(err, {})
    })
  }

  function updateParentJob (job) {
    if (job.hasOwnProperty('parent')) {
      if (validator.isUUID(job.parent)) {
        find({id: job.parent}, function (err, list) {
          if (err) {
            logger.warn('updateParentJob findOne err', err)
          }
          if (list.length > 0) {
            var parentJob = list[0]
            parentJob.hasChildren = true
            parentJob.children[job.id] = {
              childNo: job.childNo,
              status: job.status,
              result: job.result,
              updatedAt: job.updatedAt,
              cmdsEnv: job.triggerInfo.cmdsEnv
            }
            parentJob = updateParentJobStatusAndResults(parentJob)

            jobUpdate(parentJob, function (err, id) {
              if (err) {
                logger.warn('jobUpdate failed to update parentJob', err)
              }
            })
          }
        })
      }
    }
  }

  function updateParentJobStatusAndResults (parentJob) {
    var parentResult = 'pending'
    var parentStatus = 'running'
    for (var childId in parentJob.children) {
      if (parentJob.children.hasOwnProperty(childId)) {
        var status = parentJob.children[childId].status
        var result = parentJob.children[childId].result
        if (result === 'failed') parentResult = result // if at least one child job fails the parent job fails
        if (status === 'aborted') parentStatus = status // if at least one child job was aborted the parent job also counts as aborted
        if (status === 'running' && parentStatus !== 'aborted') parentStatus = status // if one job is running the parent counts as running
      }
    }
    if (forEveryKeyInObject(parentJob.children, function (childId) {
        return parentJob.children[childId].status === 'finished'
      })) {
      parentStatus = 'finished'
    }
    if (forEveryKeyInObject(parentJob.children, function (childId) {
        return parentJob.children[childId].result === 'success'
      })) {
      parentResult = 'success'
    }
    parentJob.status = parentStatus
    parentJob.result = parentResult
    return parentJob
  }

  // returns true iff fn(key) returns true for all keys
  // otherwise false
  function forEveryKeyInObject (obj, fn) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (!fn(key)) return false
      }
    }
    return true
  }
}
