const Router = require("express");
const { AuthController } = require("../Controller/Auth");
const { json } = require("body-parser");
const { verify } = require("jsonwebtoken");
const { GetToken } = require("../Middleware/GetToken");


const router = Router();
const Controller = new AuthController();

router.post("/api/signup", json(),(request, response) => {
  Controller.signUp(request, response);
});

//json() => pass this middlware when no media data comming in
router.post("/api/signin", json(), (request, response) => {
  Controller.signIn(request, response);
});

router.get("/verifyemail/:token", async (request, response) => {
  Controller.verifyEmail(request, response);
});

module.exports = router;
