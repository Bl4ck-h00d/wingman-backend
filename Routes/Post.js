const Router = require("express");
const { PostController } = require("../Controller/Post");
const { uploadFile, getFileStream } = require("../Config/S3");
const { Authenticate } = require("../Middleware/Auth");
const { GetToken } = require("../Middleware/GetToken");
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

router.get("/api/get-posts", GetToken, (request, response) => {
  Controller.getPosts(request, response);
});

router.put("/api/ratings/:id", Authenticate, (request, response) => {
  Controller.updatePostRating(request, response);
});

router.delete("/api/delete-post/:id", Authenticate, (request, response) => {
  Controller.deletePost(request, response);
});

router.get("/api/post/:id", GetToken, (request, response) => {
  Controller.getPostById(request, response);
});

router.post("/api/comments", Authenticate, (request, response) => {
  Controller.postComment(request, response);
});

router.put("/api/comments/ratings/:id", Authenticate, (request, response) => {
  Controller.updateCommentRating(request, response);
});

module.exports = router;
