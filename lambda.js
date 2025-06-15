const serverless = require('serverless-http');
const app = require('./index');

module.exports.handler = async (event, context) => {
  console.log("--- API Gatewayから受け取った生のイベント ---");
  console.log(JSON.stringify(event, null, 2));
  console.log("-----------------------------------------");

  const result = await serverless(app)(event, context);
  return result;
};