const { verify } = require("jsonwebtoken");
require("dotenv").config();

const Authenticate = (request, response, next) => {
  const token = request.header("authorization").split(" ")[1];

  verify(token, process.env.cookie_secret, (error, decoded) => {
    if (error) {
      return response.status(401).json({ msg: "Login required" });
    }
    request.token = decoded;
    next();
  });
};


module.exports = {
    Authenticate
}