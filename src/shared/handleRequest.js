const commonResponseHeaders = {
  "content-type": "application/json",
  "Access-Control-Allow-Origin": "*",
};
const bfj = require("bfj");

class HandleRequest {
  constructor(request, response) {
    response.sendResponse = this.response(request, response);
  }

  response(request, response) {
    return async function sendResponse(
      payload,
      httpStatusCode = 200,
      plainResponse
    ) {
      payload = payload || {};

      if (!plainResponse) {
        payload = {
          Status: "success",
          Data: payload,
        };
      }

      response.writeHead(httpStatusCode, commonResponseHeaders);
      response.end(await bfj.stringify(payload));
    };
  }
}

module.exports = HandleRequest;
