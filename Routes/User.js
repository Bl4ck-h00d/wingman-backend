const Router = require("express");
const { UserController } = require("../Controller/User");
const { Authenticate } = require("../Middleware/Auth");
const { GetToken } = require("../Middleware/GetToken");


const router = Router();
const Controller = new UserController();


router.get("/api/profile/:username", GetToken, (request, response) => {
  Controller.getUser(request, response);
});

module.exports = router;
