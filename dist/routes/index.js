'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (emitter) {
  var drones = new _drones2.default();
  var users = new _users2.default();
  var environments = new _environments2.default();

  return [].concat((0, _projects2.default)(emitter), drones.routes(), (0, _jobs2.default)(emitter), users.routes(), environments.routes());
};

var _drones = require('./drones');

var _drones2 = _interopRequireDefault(_drones);

var _users = require('./users');

var _users2 = _interopRequireDefault(_users);

var _environments = require('./environments');

var _environments2 = _interopRequireDefault(_environments);

var _jobs = require('./jobs');

var _jobs2 = _interopRequireDefault(_jobs);

var _projects = require('./projects');

var _projects2 = _interopRequireDefault(_projects);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=index.js.map