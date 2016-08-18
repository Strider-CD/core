'use strict';

var _dec, _dec2, _dec3, _dec4, _dec5, _class, _desc, _value, _class2;

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
var User = require('../models/user');
var bcrypt = require('bcryptjs');
var uuid = require('node-uuid');
var JWT = require('jsonwebtoken');
var userPath = config.apiPrefix + 'users';

let Users = (_dec = web.controller(userPath), _dec2 = web.get('/'), _dec3 = web.post('/'), _dec4 = web.config({
  auth: 'userBasicAuth'
}), _dec5 = web.get('/login'), _dec(_class = (_class2 = class Users {
  all(request, reply) {
    User.findByQuery({}).then(function (list) {
      reply(list.map(item => {
        if (item.secret) item.secret = undefined; // filter out secret before replying
      }));
    }).then(null, function (err) {
      reply(err).code(503);
    });
  }

  create(request, reply) {
    var user = request.payload;
    if (!user.secret || !user.name) return reply('malformed request').code(400);
    // hash secret and store user in DB
    bcrypt.genSalt(10, function (err, salt) {
      if (err) return reply(err).code(503);
      bcrypt.hash(user.secret, salt, function (err, hash) {
        if (err) return reply(err).code(503);
        user.secret = hash;
        user.save(user).then(function (id) {
          reply(id);
        }).then(null, function (error) {
          reply(error).code(503);
        });
      });
    });
  }

  login(request, reply) {
    let id = request.auth.credentials.id;
    let name = request.auth.credentials.name;
    if (name === 'guest') {
      let session = {
        parent: id,
        id: id,
        type: 'guest',
        valid: true,
        exp: new Date().getTime() + 24 * 60 * 60 * 1000 // expires in 24 hours
      };
      let token = JWT.sign(session, config.jwtSecret);
      return reply({ token: token }).header('Authorization', token);
    }
    User.findByQuery({ 'id': id }).then(function (list) {
      if (list.length < 1) return reply('').code(503);
      let user = list[0];
      user.session = {
        parent: id,
        id: uuid.v1(),
        type: 'user',
        valid: true,
        exp: new Date().getTime() + 24 * 60 * 60 * 1000 // expires in 24 hours
      };
      let token = JWT.sign(user.session, config.jwtSecret);
      User.update(user.id, user).then(function (id) {
        reply({ token: token }).header('Authorization', token);
      }).then(null, function (err) {
        reply(err).code(404);
      });
    }).then(null, function (err) {
      reply(err).code(503);
    });
  }
}, (_applyDecoratedDescriptor(_class2.prototype, 'all', [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, 'all'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'create', [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, 'create'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'login', [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, 'login'), _class2.prototype)), _class2)) || _class);


module.exports = Users;
//# sourceMappingURL=users.js.map