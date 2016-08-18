'use strict';

var Joi = require('joi');
var config = require('config');
var SimpleCollection = require('./simple-collection');
var MongooseCollection = require('./mongoose-collection');
var schema = Joi.object().keys({
  id: Joi.string().required(),
  name: Joi.string().required(),
  secret: Joi.string(),
  role: Joi.string().only(['user', 'admin', 'guest']).required(),
  projects: Joi.array().items(Joi.string()).required(),
  session: Joi.object().keys({})
});

let UserCollection = class UserCollection extends SimpleCollection {};
let UserCollectionMongoose = class UserCollectionMongoose extends MongooseCollection {};


if (config.dbType === 'mongodb') {
  module.exports = new UserCollectionMongoose(schema);
} else {
  module.exports = new UserCollection(schema);
}
//# sourceMappingURL=user.js.map