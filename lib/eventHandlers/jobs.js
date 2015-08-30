var Job = require('../models/job.js').Job
var logger = require('../util/log.js')(module)
var validator = require('validator')
var lodash = require('lodash')

module.exports = function (emitter, client) {
  emitter.on('jobs.find', find)
  emitter.on('jobs.job.update', jobUpdate)
  emitter.on('jobs.job.stop', jobStop)
  emitter.on('jobs.job.changed', jobChanged)
  emitter.on('jobs.queue.get', queueGet)
  emitter.on('jobs.queue.insert', queueInsert)

  function find (query, cb) {
    var jobQuery = query || {}
    Job.collection().findByQuery(jobQuery).then(function (list) {
      cb(null, list)
    }).catch(function (err) {
      logger.warn('error ', err)
      cb(err, {})
    })
  }

  function jobUpdate (job, cb) {
    Job.collection().findOneById(job.id).then(function (foundJob) {
      Object.assign(foundJob, job)
      foundJob.updatedAt = new Date().getTime()
      updateParrentJob(foundJob)
      emitter.emit('jobs.job.changed', job, function(err, res) {})
      Job.collection().update(foundJob.id, foundJob).then(function (id) {
        cb(null, id)
        return
      }).catch(function (err) {
        cb(err, {})
        return
      })
    }).catch(function (err) {
      cb(err, {})
      return
    })
  }

  function jobStop (job, cb) {
    job.status = 'aborted'
    job.updatedAt = new Date().getTime()
    updateParrentJob(job)
    emitter.emit('jobs.job.changed', job, function(err, res) {})
    Job.collection().save(job).then(function (id) {
      cb(null, id)
    }).catch(function (err) {
      cb(err, {})
    })
  }

  function jobChanged (job, cb) {
    client.write({room: 'job.changes', id: job.id, status: job.status, result: job.result, children: job.children})
  }

  function queueGet (cb) {
    var query = {'status': 'received'}
    find(query, function (err, list) {
      if (err) {
        cb(err, {})
        return
      }
      if (list.length > 0) {
        var job = lodash.sortBy(list, function (jobItem) { return jobItem.updatedAt})[0]
        job.status = 'running'
        jobUpdate(job, function (err, id) {
          cb(err, job)
          return
        })
        emitter.emit('jobs.job.changed', job, function(err, res) {})
      } else {
        cb(err, '')
        return
      }
    })
  }

  function queueInsert (job, cb) {
    job.status = 'received'
    job.updatedAt = new Date().getTime()

    Job.collection().save(job).then(function (id) {
      job.id = id
      updateParrentJob(job)
      emitter.emit('jobs.job.changed', job, function(err, res) {})
      cb(null, id)
    }).catch(function (err) {
      cb(err, {})
    })
  }

  function updateParrentJob (job) {
    if (job.hasOwnProperty('parrent')) {
      if (validator.isUUID(job.parrent)) {
        find({id: job.parrent}, function (err, list) {
          if (err) {
            logger.warn('updateParrentJob findOne err', err)
          }
          if (list.length > 0) {
            var parrentJob = list[0]
            parrentJob.hasChildren = true
            parrentJob.children[job.id] = {
              childNo: job.childNo,
              status: job.status,
              result: job.result,
              updatedAt: job.updatedAt,
              cmdsEnv: job.triggerInfo.cmdsEnv
            }
            parrentJob = updateParrentJobStatusAndResults(parrentJob)

            jobUpdate(parrentJob, function (err, id) {
              if (err) {
                logger.warn('updateParrentJob err', err)
              }
            })
          }
        })
      }
    }
  }

  function updateParrentJobStatusAndResults (parrentJob) {
    var parrentResult = 'pending'
    var parrentStatus = 'running'
    for (var childId in parrentJob.children) {
      if (parrentJob.children.hasOwnProperty(childId)) {
        var status = parrentJob.children[childId].status
        var result = parrentJob.children[childId].result
        if (result === 'failed') parrentResult = result // if at least one child job fails the parrent job fails
        if (status === 'aborted') parrentStatus = status // if at least one child job was aborted the parrent job also counts as aborted
        if (status === 'running' && parrentStatus !== 'aborted') parrentStatus = status // if one job is running the parrent counts as running
      }
    }
    if (forEveryKeyInObject(parrentJob.children, function (childId) {
        return parrentJob.children[childId].status === 'finished'
      })) {
      parrentStatus = 'finished'
    }
    if (forEveryKeyInObject(parrentJob.children, function (childId) {
        return parrentJob.children[childId].result === 'success'
      })) {
      parrentResult = 'success'
    }
    parrentJob.status = parrentStatus
    parrentJob.result = parrentResult
    return parrentJob
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
