'use strict';

var Primus = require('primus');
var Rooms = require('primus-rooms');
var Joi = require('joi');
var logger = require('../util/log')(module);

var handleDroneOutput = require('./droneOutput');
var handleJoinLeave = require('./joinLeave');
var handlePingPong = require('./pingPong');

var baseSchema = Joi.object().keys({
  room: Joi.string().guid(),
  type: Joi.string().only(['stdout', 'stderr', 'join', 'leave', 'ping', 'pong', 'jobs.job.changed']).required(),
  msg: Joi.object().required()
});

function PrimusHandler(httpServer) {
  return PrimusInit(httpServer);
}

function PrimusInit(server) {
  var primus = Primus(server.listener, {});
  primus.use('rooms', Rooms);

  primus.on('connection', function (spark) {
    logger.debug(`connection from spark: ${ spark.id }`);
    spark.on('data', function (data) {
      Joi.validate(data, baseSchema, function (err, res) {
        if (err) logger.debug('Received malformed primus message', err);else processMessage(spark, data);
      });
    });
  });
  return primus;
}

function processMessage(spark, data) {
  switch (data.type) {
    case 'outputCtrl':
      handleDroneOutput(spark, data);
      break;
    case 'stdout':
      // TODO: auth code for drone
      handleDroneOutput(spark, data);
      break;
    case 'stderr':
      // TODO: auth code for drone
      handleDroneOutput(spark, data);
      break;
    case 'join':
      handleJoinLeave(spark, data);
      break;
    case 'leave':
      handleJoinLeave(spark, data);
      break;
    case 'ping':
      handlePingPong(spark, data);
      break;
    case 'pong':
      handlePingPong(spark, data);
      break;
  }
}

module.exports = PrimusHandler;
//# sourceMappingURL=index.js.map