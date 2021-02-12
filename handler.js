'use strict';
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

AWS.config.loadFromPath('./config.json');
const deps = {
  dbClient: new AWS.DynamoDB({ apiVersion: '2012-08-10' }),
};


const generator = require('./generate');
const getter = require('./get');


module.exports.handler = async event => {

  if (event.httpMethod === "GET") {
    return getter(deps, event);
  }
  if (event.httpMethod === "POST") {
    return generator(deps, event);
  }

};
let shortUrlnerModel = {
  code: '',
  originalUrl: '',
  expiredDate: '',
  timesToExpire: 0,
  redirectType: 0,
  status: '',
  count: 0,
  mode: ''
}
