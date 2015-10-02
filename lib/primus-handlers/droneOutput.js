var Joi = require('joi')
var logger = require('../util/log')(module)
var Job = require('../models/job')

var msgSchema = Joi.object().keys({
  line: Joi.string().required(),
  lineNumber: Joi.number().required()
})

module.exports = function (spark, data) {
  console.log('droneOutput received data', data)
  console.log('droneOutput token', spark.request.decoded_token)
  Joi.validate(data.msg, msgSchema, function (err, res) {
    if (err) {
      logger.warn('Malformed drone output received', err)
      return
    }
    var decoded_token = spark.request.decoded_token
    if (decoded_token) {
      if (decoded_token.type !== 'drone') {
        logger.warn('Someone other than a drone tried to write to a room!')
        return
      }
    } else {
      logger.warn('Missing auth token!')
      return
    }
    let room = data.room
    if (~spark.rooms().indexOf(room)) {
      //logger.info(`received ${data.type} from ${spark.id}: ${data.msg.line}`)
      spark.room(room).clients(function (err, clients) {
        if (err) logger.debug('Cannot access primus room', err)
        updateJobOutput(data)
        spark.room(room).except(spark.id).write(createClientMessage(data))
      })
    }
  })
}

function createClientMessage (data) {
  return {room: data.room, type: data.type, msg: {line: data.msg.line, lineNumber: data.msg.lineNumber}}
}

function updateJobOutput (data) {
  Job.findById(data.room).then(function (list) {
    if (list.length > 0) {
      var job = list[0]
      if (data.type === 'stdout') {
        job.stdout[data.msg.lineNumber] = data.msg.line
      } else if (data.type === 'stderr') {
        job.stderr[data.msg.lineNumber] = data.msg.line
      }
      Job.update(data.room, job).then(function (id) {
        logger.debug(`Updated output for job with id ${id}`)
      }).catch(function (err) {
        logger.warn(`Unable to update job with id ${data.room}`, err)
      })
    }
  }).catch(function (err) {
    logger.warn(`Unable to find job with id ${data.room}`, err)
  })
}
