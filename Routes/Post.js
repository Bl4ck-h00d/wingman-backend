const Router = require("express");
const { PostController } = require("../Controller/Post");
const { uploadFile, getFileStream } = require("../Config/S3");
const { Authenticate } = require("../Middleware/Auth");
const multer = require("multer");
const upload = multer({ dest: "Uploads/" });
const { verify } = require("jsonwebtoken");

const router = Router();
const Controller = new PostController();

router.get("/api/images/:key", upload.any("images"), (request, response) => {
  const key = request.params.key;
  const readStream = getFileStream(key);

  readStream.pipe(response);
});

router.post(
  "/api/create-post",
  Authenticate,
  upload.any("images"),
  (request, response) => {
    Controller.createPost(request, response);
  }
);

router.get("/api/get-posts", (request, response) => {
  const token = request.header("authorization").split(" ")[1];

  verify(token, process.env.cookie_secret, (error, decoded) => {
    if (error) {
      request.token = null;
    } else {
      request.token = decoded;
    }
  });
  Controller.getPosts(request, response);
});

router.put("/api/ratings/:id", Authenticate, (request, response) => {
  Controller.updateRating(request, response);
});

module.exports = router;
