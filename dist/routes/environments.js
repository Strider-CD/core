'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dec, _dec2, _dec3, _class, _desc, _value, _class2;

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _hapiDecorators = require('hapi-decorators');

var _hapiDecorators2 = _interopRequireDefault(_hapiDecorators);

var _environment = require('../models/environment');

var _environment2 = _interopRequireDefault(_environment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var basePath = _config2.default.apiPrefix + 'environments';

let Environments = (_dec = _hapiDecorators2.default.controller(basePath), _dec2 = _hapiDecorators2.default.get('/'), _dec3 = _hapiDecorators2.default.post('/'), _dec(_class = (_class2 = class Environments {
  all(request, reply) {
    _environment2.default.findByQuery({}).then(function (items) {
      reply(items);
    }).catch(function (error) {
      reply(error).code(400);
    });
  }

  create(request, reply) {
    var payload = request.payload;

    if (!payload.name) {
      return reply('malformed request').code(400);
    }

    _environment2.default.save(payload).then(function (id) {
      reply(id);
    }).catch(error => reply(error).code(500));
  }
}, (_applyDecoratedDescriptor(_class2.prototype, 'all', [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, 'all'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'create', [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, 'create'), _class2.prototype)), _class2)) || _class);
exports.default = Environments;
//# sourceMappingURL=environments.js.map