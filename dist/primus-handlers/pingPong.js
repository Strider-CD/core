'use strict';

var logger = require('../util/log')(module);

module.exports = function (spark, data) {
  if (data.type === 'ping') {
    spark.join(data.room, function () {
      logger.info(`Got a ping from spark with id: ${ spark.id } in room: ${ data.room }; sending a pong`);
      spark.write({ room: data.room, type: 'pong', msg: {} });
    });
  } else if (data.type === 'pong') {
    spark.leave(data.room, function () {
      logger.info(`Got a pong from id: ${ spark.id } in room: ${ data.room }`);
    });
  }
};
//# sourceMappingURL=pingPong.js.map