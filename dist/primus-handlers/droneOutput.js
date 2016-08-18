'use strict';

var Joi = require('joi');
var logger = require('../util/log')(module);
var Job = require('../models/job');
var config = require('config');

var msgSchema = Joi.object().keys({
  line: Joi.string().required(),
  lineNumber: Joi.number().required()
});

module.exports = function (spark, data) {
  Joi.validate(data.msg, msgSchema, function (err, res) {
    if (err) {
      logger.warn('Malformed drone output received', err);
      return;
    }
    var decodedToken = spark.request.decoded_token;
    if (decodedToken) {
      if (decodedToken.type !== 'drone') {
        logger.warn('Someone other than a drone tried to write to a room!');
        return;
      }
    } else {
      logger.warn('Missing auth token!');
      return;
    }
    let room = data.room;
    if (~spark.rooms().indexOf(room)) {
      logger.debug(`received ${ data.type } from ${ spark.id }: ${ data.msg.line }`);
      spark.room(room).clients(function (err, clients) {
        if (err) logger.debug('Cannot access primus room', err);
        updateJobOutput(data);
        spark.room(room).except(spark.id).write(createClientMessage(data));
      });
    }
  });
};

function createClientMessage(data) {
  return { room: data.room, type: data.type, msg: { line: data.msg.line, lineNumber: data.msg.lineNumber } };
}

function updateJobOutput(data) {
  if (config.dbType === 'mongodb' && (data.type === 'stdout' || data.type === 'stderr')) {
    var job = {};
    if (data.type === 'stdout') {
      job.stdout = {};
      job.stdout[data.msg.lineNumber] = data.msg.line;
    } else if (data.type === 'stderr') {
      job.stderr = {};
      job.stderr[data.msg.lineNumber] = data.msg.line;
    }
    Job.updateDiff(data.room, job);
    return;
  }

  Job.findById(data.room).then(function (list) {
    if (list.length > 0) {
      var job = list[0];
      if (data.type === 'stdout') {
        job.stdout[data.msg.lineNumber] = data.msg.line;
      } else if (data.type === 'stderr') {
        job.stderr[data.msg.lineNumber] = data.msg.line;
      }
      Job.update(data.room, job).then(function (id) {
        logger.debug(`Updated output for job with id ${ id }`);
      }).then(null, function (err) {
        logger.debug(`Unable to update job with id ${ data.room } ${ err }`);
      });
    }
  }).then(null, function (err) {
    logger.warn(`Unable to find job with id ${ data.room } ${ err }`);
  });
}
//# sourceMappingURL=droneOutput.js.map