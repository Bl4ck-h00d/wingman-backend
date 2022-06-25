const pool = require("../Config/Database");
const { uploadFile, getFileStream } = require("../Config/S3");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

const atob = (base64) => {
  return Buffer.from(base64, "base64").toString("binary");
};

class PostController {
  async createPost(request, response) {
    try {
      const token = request.header("authorization").split(" ")[1];
      const payload = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payload));

      const author = decodedPayload.username;
      const files = request.files;


      let { title, description, tags, anonymous } = request.body;
      tags = [...tags.split(",")];
      anonymous = anonymous === "true" ? true : false;

      const images = await Promise.all(
        files.map(async (file, _) => {
          const result = await uploadFile(file);
          return "/api/images/" + result.key;
        })
      );

      files.forEach(async (file, _) => {
        await unlinkFile(file.path);
      });

      // console.log(images);

      return response
        .status(201)
        .json({ type: "success", msg: "Image Uploaded succesfully" });
    } catch (error) {
      console.log(error);
      return response.status(500).json({ type: "success", msg: error });
    }
  }
}

module.exports = {
  PostController,
};
