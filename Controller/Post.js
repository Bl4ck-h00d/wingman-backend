const pool = require("../Config/Database");
const { uploadFile, getFileStream } = require("../Config/S3");
const fs = require("fs");
const util = require("util");
const { post } = require("../Routes/Post");
const unlinkFile = util.promisify(fs.unlink);

class PostController {
  async createPost(request, response) {
    try {
      const token = request.token;
      const author = token.username;
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

      const query =
        "INSERT INTO posts (media,title,description,author,anonymous,tags) VALUES ($1,$2,$3,$4,$5,$6)";

      pool
        .query(query, [images, title, description, author, anonymous, tags])
        .then(() => {
          return response
            .status(201)
            .json({ type: "success", msg: "Post created succesfully" });
        })
        .catch((error) => {
          console.log(error);
          return response.status(500).json({ type: "error", msg: error });
        });
    } catch (error) {
      console.log(error);
      return response.status(500).json({ type: "error", msg: error });
    }
  }

  async getPosts(request, response) {
    try {
      const query =
        "SELECT posts.id, posts.media, posts.title,posts.description,posts.tags,posts.anonymous,posts.ratings, CASE WHEN posts.anonymous=true THEN NULL ELSE users.username END, COUNT(comments.comment) AS comments FROM posts INNER JOIN users ON posts.author=users.username LEFT JOIN comments ON posts.id=comments.postId GROUP BY posts.id, users.username";

      let data = (await pool.query(query)).rows;

      if (
        request.token !== undefined &&
        request.token !== null &&
        request.token !== "undefined"
      ) {
        const token = request.token;
        const username = token.username;
        const postsLikedByUserQuery =
          "SELECT postratings.postid AS postid, postratings.username, postratings.rating FROM postratings WHERE postratings.username=$1";

        const postsLikedByUserData = (
          await pool.query(postsLikedByUserQuery, [username])
        ).rows;
        data = [...data, { postsLiked: postsLikedByUserData }];
      }

      return response.status(200).json(data);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ type: "error", msg: error });
    }
  }

  async updateRating(request, response) {
    const tokenPayload = request.token;
    const postId = request.params.id;
    const username = tokenPayload.username;
    const userVote = request.body.userVote;

    console.log(userVote);
    try {
      //Update postratings table
      let query =
        "INSERT INTO postratings(postId,username,rating) VALUES ($1,$2,$3) ON CONFLICT (username) DO UPDATE SET rating = EXCLUDED.rating";

      await pool.query(query, [postId, username, userVote]);

      //Update post table
      query =
        "SELECT SUM(postratings.rating) FROM postratings WHERE postratings.postid=$1";

      const totalRatings = (await pool.query(query, [postId])).rows[0].sum;

      query = "UPDATE posts SET ratings=$1 WHERE posts.id=$2";

      await pool.query(query, [totalRatings, postId]);

      return response.status(201).json({ msg: "ratings updated" });
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  }
}

module.exports = {
  PostController,
};
