const Router = require("express");
const { PostController } = require("../Controller/Post");
const { uploadFile, getFileStream } = require("../Config/S3");

const multer = require("multer");
const upload = multer({ dest: "Uploads/" });

const router = Router();
const Controller = new PostController();

router.get("/api/images/:key", upload.any("images"), (request, response) => {
  const key = request.params.key;
  const readStream = getFileStream(key);

  readStream.pipe(response);
});

router.post("/api/create-post", upload.any("images"), (request, response) => {
 
  // console.log(request.header("authorization"))
  Controller.createPost(request, response);
});

module.exports = router;
