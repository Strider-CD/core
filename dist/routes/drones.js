'use strict';

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _desc, _value, _class2;

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

var config = require('config');
var web = require('hapi-decorators');
var Drone = require('../models/drone');
var uuid = require('node-uuid');
var JWT = require('jsonwebtoken');
var dronePath = config.apiPrefix + 'drones';

let Drones = (_dec = web.controller(dronePath), _dec2 = web.get('/'), _dec3 = web.post('/'), _dec4 = web.get('/{id}'), _dec5 = web.get('/session/refresh'), _dec6 = web.post('/checkin/{token}'), _dec(_class = (_class2 = class Drones {
  all(request, reply) {
    Drone.findByQuery({}).then(function (list) {
      var returnList = clone(list);
      returnList.slice().map(item => {
        if (item.session) delete item.session; // filter out session before replying
      });
      reply(returnList);
    }).catch(function (err) {
      reply(err).code(503);
    });
  }

  /*
   * Saves a drone and replies a token
   */

  create(request, reply) {
    var drone = request.payload;
    if (!drone.name) return reply('malformed request').code(400);

    Drone.save(drone).then(function (id) {
      Drone.findByQuery({ 'id': id }).then(function (list) {
        if (!list.length) return reply('').code(503);

        let drone = list[0];
        drone.session = generateSession(id);
        let token = JWT.sign(drone.session, config.jwtSecret);
        drone.token = token;

        Drone.update(drone.id, drone).then(function (id) {
          reply(drone);
        }).then(null, function (err) {
          reply(err).code(503);
        });
      }).then(null, function (error) {
        reply(error).code(503);
      });
    });
  }

  /*
   * Return a single drone by id
   */

  single(request, reply) {
    Drone.findOneById(request.params.id).then(drone => {
      reply(drone);
    }).catch(error => reply(error.message).code(error.code || 500));
  }

  /*
   * Refresh session and token information for a drone
   */

  login(request, reply) {
    let id = request.auth.credentials.parent;
    Drone.findByQuery({ 'id': id }).then(function (list) {
      if (!list.length) return reply('').code(503);

      let drone = list[0];
      drone.session = generateSession(id);
      let token = JWT.sign(drone.session, config.jwtSecret);

      Drone.update(drone.id, drone).then(function (id) {
        reply({ text: 'Check auth headers for your token' }).header('Authorization', token);
      }).then(null, function (err) {
        reply(err).code(404);
      });
    }).then(null, function (err) {
      reply(err).code(503);
    });
  }

  checkIn(request, reply) {
    var token = request.params.token;

    if (token) {
      JWT.verify(token, config.jwtSecret, function (err, decoded) {
        if (err) {
          return reply(err).code(401);
        }

        Drone.update(decoded.parent, { status: 'active' }).then(id => {
          reply();
        }).catch(error => {
          reply(error).code(500);
        });
      });
    } else {
      reply('missing token').code(400);
    }
  }
}, (_applyDecoratedDescriptor(_class2.prototype, 'all', [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, 'all'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'create', [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, 'create'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'single', [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, 'single'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'login', [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, 'login'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'checkIn', [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, 'checkIn'), _class2.prototype)), _class2)) || _class);


function generateSession(id) {
  return {
    parent: id,
    id: uuid.v1(),
    type: 'drone',
    valid: true,
    exp: new Date().getTime() + 5 * 365 * 24 * 60 * 60 * 1000 // expires in 5 years
  };
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = Drones;
//# sourceMappingURL=drones.js.map