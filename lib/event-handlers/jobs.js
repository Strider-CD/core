'use strict'

var logger = require('../util/log.js')(module)
var validator = require('validator')
var lodash = require('lodash')
var Job = require('../models/job')
var Promise = require('bluebird')

module.exports = function (emitter, client) {
  emitter.on('jobs.find', find)
  emitter.on('jobs.job.update', jobUpdate)
  emitter.on('jobs.job.stop', jobStop)
  emitter.on('jobs.frontend.getByQuery', frontendGetByQuery)
  emitter.on('jobs.queue.get', queueGet)
  emitter.on('jobs.queue.insert', queueInsert)

  function find (query, cb) {
    var jobQuery = query || {}
    Job.findByQuery(jobQuery).then(function (list) {
      cb(undefined, list)
    }).then(null, function (err) {
      cb(err)
    })
  }

  function jobUpdate (job, cb) {
    Job.findOneByQuery({id: job.id}).then(function (foundJob) {
      Object.assign(foundJob, job)
      foundJob.updatedAt = new Date().getTime()
      updateParentJob(foundJob)
      Job.update(foundJob.id, foundJob).then(function (id) {
        notifyClients(job, client)
        cb(undefined, id)
        return
      }).then(null, function (err) {
        cb(err)
        return
      })
    }).then(null, function (err) {
      cb(err)
      return
    })
  }

  function jobStop (job, cb) {
    job.status = 'aborted'
    job.updatedAt = new Date().getTime()
    updateParentJob(job)
    Job.save(job).then(function (id) {
      cb(null, id)
    }).then(null, function (err) {
      cb(err, {})
    })
  }

  function frontendGetByQuery (query, cb) {
    var jobQuery = query || {}
    Job.findByQuery(jobQuery).then(function (jobList) {
      if (jobList.length === 1) {
        if (!(jobList[0].hasChildren)) {
          return cb(null, jobList)
        }
      }
      Promise.map(jobList, function (job) {
        if (job.hasChildren) {
          job.children = {}
          return Job.findByQuery({parent: job.id}).then(function (children) {
            children.forEach(function (child, index, array) {
              job.children[child.id] = {
                childNo: child.childNo,
                status: child.status,
                result: child.result,
                updatedAt: child.updatedAt,
                cmdsEnv: child.triggerInfo.cmdsEnv
              }
              job = updateParentJobStatusAndResults(job)
            })
            return Promise.resolve(job)
          }).then(null, function (err) {
            return Promise.reject(new Error(`failed to find child jobs $(err)`))
          })
        } else {
          return Promise.resolve(jobList)
        }
      }).then(function (list) {
        return cb(undefined, list)
      }).then(null, function (err) {
        return cb(new Error(`failed to collect child jobs $(err)`))
      })
    }).then(null, function (err) {
      return cb(err)
    })
  }

  function queueGet (cb) {
    var query = {'status': 'received'}
    find(query, function (err, list) {
      if (err) {
        cb(err, undefined)
        return
      }

      if (list.length > 0) {
        let job = lodash.sortBy(list, jobItem => jobItem.receivedAt)[0]

        job.status = 'running'
        job.runningSince = new Date().getTime()
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
    job.receivedAt = new Date().getTime()
    job.updatedAt = new Date().getTime()
    Job.save(job).then(function (id) {
      job.id = id
      updateParentJob(job)
      cb(undefined, id)
    }).then(null, function (err) {
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
            /*
            parentJob.children[job.id] = {
              childNo: job.childNo,
              status: job.status,
              result: job.result,
              updatedAt: job.updatedAt,
              cmdsEnv: job.triggerInfo.cmdsEnv
            }
            parentJob = updateParentJobStatusAndResults(parentJob)
            */
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

  function notifyClients (job, client) {
    let message = {
      room: job.id,
      type: 'job.update',
      msg: {
        status: job.status,
        result: job.result,
        hasChildren: job.hasChildren,
        children: job.children
      }
    }
    logger.debug('jobs notifyClients ', message)
    client.write(message)
  }
}
