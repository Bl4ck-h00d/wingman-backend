const { verify } = require("jsonwebtoken");
require("dotenv").config();

const GetToken = (request, response, next) => {
  const token = request.header("authorization")!==undefined && request.header("authorization").split(" ")[1];

  verify(token, process.env.cookie_secret, (error, decoded) => {
    if (error) {
      request.token = null;
    }
    request.token = decoded;
    next();
  });
};

module.exports = {
  GetToken,
};
