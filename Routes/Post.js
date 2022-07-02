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

router.put(
  "/api/update-post/:id",
  Authenticate,
  upload.any("images"),
  (request, response) => {
    Controller.updatePost(request, response);
  }
);

router.post("/api/comments", Authenticate, (request, response) => {
  Controller.postComment(request, response);
});

router.put("/api/comments/ratings/:id", Authenticate, (request, response) => {
  Controller.updateCommentRating(request, response);
});

router.put("/api/update-comment/:id", Authenticate, (request, response) => {
  Controller.updateComment(request, response);
});

router.delete("/api/delete-comment/:id", Authenticate, (request, response) => {
  Controller.deleteComment(request, response);
});

router.post("/api/save/:id", Authenticate, (request, response) => {
  Controller.savePost(request, response);
});

router.post("/api/search", GetToken, (request, response) => {
  Controller.searchPost(request, response);
});

router.get("/api/tags", (request, response) => {
  Controller.getTags(request, response);
});



module.exports = router;
