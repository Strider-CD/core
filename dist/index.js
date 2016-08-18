'use strict';

var _hapi = require('hapi');

var _hapi2 = _interopRequireDefault(_hapi);

var _hapiAuthBasic = require('hapi-auth-basic');

var _hapiAuthBasic2 = _interopRequireDefault(_hapiAuthBasic);

var _hapiAuthJwt = require('hapi-auth-jwt2');

var _hapiAuthJwt2 = _interopRequireDefault(_hapiAuthJwt);

var _good = require('good');

var _good2 = _interopRequireDefault(_good);

var _bcryptjs = require('bcryptjs');

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _auth = require('./auth');

var _auth2 = _interopRequireDefault(_auth);

var _log = require('./util/log');

var _log2 = _interopRequireDefault(_log);

var _routes = require('./routes');

var _routes2 = _interopRequireDefault(_routes);

var _eventHandlers = require('./event-handlers');

var _eventHandlers2 = _interopRequireDefault(_eventHandlers);

var _primusHandlers = require('./primus-handlers');

var _primusHandlers2 = _interopRequireDefault(_primusHandlers);

var _user = require('./models/user');

var _user2 = _interopRequireDefault(_user);

var _project = require('./models/project');

var _project2 = _interopRequireDefault(_project);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = (0, _log2.default)(module);
var server = new _hapi2.default.Server({
  connections: {
    routes: {
      cors: true
    }
  }
});

server.connection({
  port: _config2.default.port
});

var primus = new _primusHandlers2.default(server);
primus.authorize(_auth2.default.primusJwtAuth);
server.primus = primus;

var emitter = new _eventemitter2.default();
(0, _eventHandlers2.default)(emitter, primus);

var hapiPlugins = [_hapiAuthBasic2.default, _hapiAuthJwt2.default, {
  register: _good2.default,
  options: {
    reporters: [{
      reporter: require('good-console'),
      events: { log: ['error', 'medium'], error: '*' }
    }]
  }
}];

server.register(hapiPlugins, function (err) {
  if (err) {
    return console.error(err);
  }
  // Basic auth for drones
  server.auth.strategy('droneBasicAuth', 'basic', { validateFunc: _auth2.default.droneBasicAuth });
  // Basic auth for users
  server.auth.strategy('userBasicAuth', 'basic', { validateFunc: _auth2.default.userBasicAuth });
  // JWT for drones, users and API calls (using user token)
  server.auth.strategy('jwtAuth', 'jwt', {
    key: _config2.default.jwtSecret,
    validateFunc: _auth2.default.jwtAuth,
    verifyOptions: { algorithms: ['HS256'] }
  });

  server.auth.default('jwtAuth');
  var routeList = (0, _routes2.default)(emitter);
  server.route(routeList);
});

// Setup on first start
setUpAdminUser();
setUpDefaultProject();

if (!module.parent) {
  server.start(function (err) {
    if (err) {
      return console.error(err);
    }

    if (!process.env.STRIDER_ADMIN_USER || !process.env.STRIDER_ADMIN_PWD) {
      logger.warn('WARNING: using default admin user name and password');
    }

    logger.info('Server started ' + server.info.uri);
  });
}

function setUpAdminUser() {
  var salt = _bcryptjs2.default.genSaltSync(10);
  var admin = {
    name: _config2.default.adminUser,
    secret: _bcryptjs2.default.hashSync(_config2.default.adminPwd, salt),
    role: 'admin',
    projects: ['default'],
    session: {}
  };
  if (_config2.default.dbType === 'mongodb') {
    require('deasync').loopWhile(function () {
      return _mongoose2.default.connection.readyState !== 1;
    });
    if (_config2.default.clearDB) {
      _mongoose2.default.connection.db.dropDatabase();
      _mongoose2.default.disconnect();
      _mongoose2.default.connect(_config2.default.mongoDbURI);
    }
    require('deasync').loopWhile(function () {
      return _mongoose2.default.connection.readyState !== 1;
    });
  }
  _user2.default.findByQuery({ name: _config2.default.adminUser }).then(function (list) {
    if (list.length === 0) {
      _user2.default.save(admin).then(function (id) {
        logger.info('created admin user with id ' + id);
        global.striderReady = true;
      }).then(null, function (err) {
        logger.warn('failed to create admin user ' + err);
      });
    } else {
      logger.warn('admin user exists and will not be replaced!');
      global.striderReady = true;
    }
  });
}

function setUpDefaultProject() {
  var project = {
    name: _config2.default.defaultProjectName,
    id: _config2.default.defaultProjectId,
    environments: [],
    provider: {
      type: 'github'
    }
  };
  if (_config2.default.dbType === 'mongodb') {
    require('deasync').loopWhile(function () {
      return _mongoose2.default.connection.readyState !== 1;
    });
    if (_config2.default.clearDB) {
      _mongoose2.default.connection.db.dropDatabase();
      _mongoose2.default.disconnect();
      _mongoose2.default.connect(_config2.default.mongoDbURI);
    }
    require('deasync').loopWhile(function () {
      return _mongoose2.default.connection.readyState !== 1;
    });
  }
  _project2.default.findByQuery({ name: _config2.default.defaultProjectName }).then(function (list) {
    if (list.length === 0) {
      _project2.default.save(project).then(function (id) {
        logger.info('created default project with id ' + id);
      }).then(null, function (err) {
        logger.warn('failed to create admin user ' + err);
      });
    } else {
      logger.warn('default project exists and will not be replaced!');
    }
  });
}

module.exports = server;
//# sourceMappingURL=index.js.map