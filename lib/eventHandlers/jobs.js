var Job = require('../models/job.js').Job
var lodash = require('lodash')

module.exports = function (emitter) {
  emitter.on('jobs.find', find)
  emitter.on('jobs.job.update', jobUpdate)
  emitter.on('jobs.job.stop', jobStop)
  emitter.on('jobs.queue.get', queueGet)
  emitter.on('jobs.queue.insert', queueInsert)

  function find (query, cb) {
    var jobQuery = query || {}
    Job.collection().findByQuery(jobQuery).then(function (list) {
      cb(null, list)
    }).catch(function (err) {
      cb(err, {})
    })
  }

  function jobUpdate (job, cb) {
    Job.collection().findOneById(job.id).then(function (foundJob) {
      Object.assign(foundJob, job)
      job.updatedAt = new Date().getTime()
      updateParrentJob(job)

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

    Job.collection().save(job).then(function (id) {
      cb(null, id)
    }).catch(function (err) {
      cb(err, {})
    })
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
      } else {
        cb(err, '')
        return
      }
    })
  }

  function queueInsert (job, cb) {
    job.status = 'received'
    job.updatedAt = new Date().getTime()
    updateParrentJob(job)

    Job.collection().save(job).then(function (id) {
      cb(null, id)
    }).catch(function (err) {
      cb(err, {})
    })
  }

  function updateParrentJob (job) {
    if (job.trigger === 'rest') {
      // check if the job is a child
      if (job.hasOwnProperty('parrent')) {
        find({id: job.parrent}, function (err, list) {
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
          }
          jobUpdate(parrentJob, function (err, id) {})
        })
      }
    }
  }
}
