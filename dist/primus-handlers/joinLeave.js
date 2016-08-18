'use strict';

var logger = require('../util/log')(module);
var lodash = require('lodash');

module.exports = function (spark, data) {
  if (data.type === 'join') {
    spark.join(data.room, function () {
      spark.room(data.room).clients(function (err, clients) {
        if (!clients || err) {
          logger.debug('No clients in room after join!', err);
          return;
        }
        if (lodash.contains(clients, spark.id)) {
          logger.debug(`spark with id: ${ spark.id } joined room: ${ data.room }`);
          spark.write({ room: data.room, type: 'join', msg: { status: 'success' } });
        } else {
          logger.warn(`spark with id: ${ spark.id } tried but COULD NOT join room: ${ data.room } because: `, err);
          spark.write({ room: data.room, type: 'join', msg: { status: 'failed' } });
        }
      });
    });
  } else if (data.type === 'leave') {
    spark.leave(data.room, function () {
      logger.debug(`spark with id: ${ spark.id } left room: ${ data.room }`);
      spark.write({ room: data.room, type: 'leave', msg: { status: 'success' } });
    });
  }
};
//# sourceMappingURL=joinLeave.js.map