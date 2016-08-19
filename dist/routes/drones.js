'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _desc, _value, _class2;

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _hapiDecorators = require('hapi-decorators');

var _hapiDecorators2 = _interopRequireDefault(_hapiDecorators);

var _drone = require('../models/drone');

var _drone2 = _interopRequireDefault(_drone);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

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

let Drones = (_dec = _hapiDecorators2.default.controller(`${ _config2.default.apiPrefix }drones`), _dec2 = _hapiDecorators2.default.get('/'), _dec3 = _hapiDecorators2.default.post('/'), _dec4 = _hapiDecorators2.default.get('/{id}'), _dec5 = _hapiDecorators2.default.get('/session/refresh'), _dec6 = _hapiDecorators2.default.post('/checkin/{token}'), _dec(_class = (_class2 = class Drones {
  all(request, reply) {
    return _asyncToGenerator(function* () {
      try {
        let list = yield _drone2.default.findByQuery({});
        let returnList = clone(list);

        returnList.slice().map(function (item) {
          if (item.session) delete item.session; // filter out session before replying
        });

        reply(returnList);
      } catch (err) {
        reply(err).code(503);
      }
    })();
  }

  /*
   * Saves a drone and replies a token
   */

  create(request, reply) {
    return _asyncToGenerator(function* () {
      let payload = request.payload;

      if (!payload.name) return reply('malformed request').code(400);

      let id = yield _drone2.default.save(payload);
      let list = yield _drone2.default.findByQuery({ 'id': id });

      if (!list.length) return reply('').code(503);

      let drone = list[0];
      let session = generateSession(id);
      let token = _jsonwebtoken2.default.sign(session, _config2.default.jwtSecret);

      drone.session = session;
      drone.token = token;

      yield _drone2.default.update(drone.id, drone);
      reply(drone);
    })();
  }

  /*
   * Return a single drone by id
   */

  single(request, reply) {
    return _asyncToGenerator(function* () {
      let drone = yield _drone2.default.findOneById(request.params.id);
      reply(drone);
    })();
  }

  /*
   * Refresh session and token information for a drone
   */

  login(request, reply) {
    return _asyncToGenerator(function* () {
      let id = request.auth.credentials.parent;
      let list = yield _drone2.default.findByQuery({ 'id': id });

      if (!list.length) return reply('').code(503);

      let drone = list[0];
      let session = generateSession(id);
      let token = _jsonwebtoken2.default.sign(session, _config2.default.jwtSecret);

      drone.session = session;

      yield _drone2.default.update(drone.id, drone);

      reply({ text: 'Check auth headers for your token' }).header('Authorization', token);
    })();
  }

  checkIn(request, reply) {
    var token = request.params.token;

    if (token) {
      _jsonwebtoken2.default.verify(token, _config2.default.jwtSecret, function (err, decoded) {
        if (err) {
          return reply(err).code(401);
        }

        _drone2.default.update(decoded.parent, { status: 'active' }).then(id => {
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
exports.default = Drones;


function generateSession(id) {
  return {
    parent: id,
    id: _nodeUuid2.default.v1(),
    type: 'drone',
    valid: true,
    exp: new Date().getTime() + 5 * 365 * 24 * 60 * 60 * 1000 // expires in 5 years
  };
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
//# sourceMappingURL=drones.js.map