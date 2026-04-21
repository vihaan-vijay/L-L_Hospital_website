require('dotenv').config();
const serverless = require('serverless-http');
const app = require('../../api-logic');

module.exports.handler = serverless(app);
