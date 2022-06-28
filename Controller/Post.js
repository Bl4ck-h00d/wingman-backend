const pool = require("../Config/Database");
const { uploadFile, getFileStream } = require("../Config/S3");
const fs = require("fs");
const util = require("util");
const { post } = require("../Routes/Post");
const unlinkFile = util.promisify(fs.unlink);
var moment = require("moment");

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
      const timestamp = moment.utc().format("ddd MMM DD YYYY HH:mm:ss z");
      const query =
        "INSERT INTO posts (media,title,description,author,anonymous,tags,timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)";

      pool
        .query(query, [
          images,
          title,
          description,
          author,
          anonymous,
          tags,
          timestamp,
        ])
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
        "SELECT posts.id, posts.media, posts.title,posts.description,posts.timestamp,posts.tags,posts.anonymous,posts.ratings, CASE WHEN posts.anonymous=true THEN NULL ELSE users.username END, COUNT(comments.comment) AS comments FROM posts INNER JOIN users ON posts.author=users.username LEFT JOIN comments ON posts.id=comments.postId GROUP BY posts.id, users.username";

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

  async updatePostRating(request, response) {
    const tokenPayload = request.token;
    const postId = request.params.id;
    const username = tokenPayload.username;
    const userVote = request.body.userVote;

    try {
      //Update postratings table
      let query =
        "INSERT INTO postratings(postId,username,rating) VALUES ($1,$2,$3) ON CONFLICT (postid,username) DO UPDATE SET rating = EXCLUDED.rating";

      await pool.query(query, [postId, username, userVote]);

      //Update post table
      query =
        "SELECT SUM(postratings.rating) FROM postratings WHERE postratings.postid=$1";

      let totalRatings = (await pool.query(query, [postId])).rows[0].sum;

      totalRatings = totalRatings === null ? 0 : totalRatings;

      query = "UPDATE posts SET ratings=$1 WHERE posts.id=$2";

      await pool.query(query, [totalRatings, postId]);

      return response.status(201).json({ msg: "ratings updated" });
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  }

  async updateCommentRating(request, response) {
    const tokenPayload = request.token;
    const commentId = request.params.id;
    const username = tokenPayload.username;
    const userVote = request.body.userVote;
    const postId = request.body.postId;

    try {
      //Update postratings table
      let query =
        "INSERT INTO commentratings(commentId,username,rating,postid) VALUES ($1,$2,$3,$4) ON CONFLICT (commentid,username) DO UPDATE SET rating = EXCLUDED.rating";

      await pool.query(query, [commentId, username, userVote, postId]);

      //Update post table
      query =
        "SELECT SUM(commentratings.rating) FROM commentratings WHERE commentratings.commentid=$1";

      let totalRatings = (await pool.query(query, [commentId])).rows[0].sum;

      totalRatings = totalRatings === null ? 0 : totalRatings;

      query = "UPDATE comments SET ratings=$1 WHERE comments.id=$2";

      await pool.query(query, [totalRatings, commentId]);

      return response.status(201).json({ msg: "ratings updated" });
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  }

  async getPostById(request, response) {
    const postId = request.params.id;

    try {
      const query = "SELECT * FROM posts WHERE posts.id=$1";

      const post = (await pool.query(query, [postId])).rows;

      let data = [{ post: post }];

      //get the rating of the current post by current user
      if (
        request.token !== undefined &&
        request.token !== null &&
        request.token !== "undefined"
      ) {
        const token = request.token;
        const username = token.username;
        const postLikedByUserQuery =
          "SELECT postratings.rating FROM postratings WHERE postratings.username=$1 AND postratings.postid=$2";

        const userRating = (
          await pool.query(postLikedByUserQuery, [username, postId])
        ).rows[0];

        if (userRating !== undefined) {
          data = [...data, { userRating: userRating.rating }];
        } else {
          data = [...data, { userRating: 0 }];
        }
      }

      const comments = await this.getComments(request, response);

      data = [...data, { comments: comments }];
      // console.log(data, comments);

      return response.status(200).json(data);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ type: "error", msg: error });
    }
  }

  async deletePost(request, response) {
    const tokenPayload = request.token;
    const postId = request.params.id;
    const username = tokenPayload.username;

    const checkQuery =
      "SELECT * FROM posts WHERE posts.id=$1 AND posts.author=$2";

    const postExists = (await pool.query(checkQuery, [postId, username]))
      .rows[0];

    if (!postExists) {
      return response.status(400).json({ msg: "INVALID OPERATION" });
    }

    const query = "DELETE FROM posts WHERE posts.id=$1";

    try {
      await pool.query(query, [postId]);
      return response.status(201).json({ msg: "Post Deleted" });
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  }

  async deleteComment(request, response) {
    const tokenPayload = request.token;
    const commentId = request.params.id;
    const username = tokenPayload.username;

    const checkQuery =
      "SELECT * FROM comments WHERE comments.id=$1 AND comments.author=$2";

    const commentExists = (await pool.query(checkQuery, [commentId, username]))
      .rows[0];

    if (!commentExists) {
      return response.status(400).json({ msg: "INVALID OPERATION" });
    }

    const query = "DELETE FROM comments WHERE comments.id=$1";

    try {
      await pool.query(query, [commentId]);
      return response.status(201).json({ msg: "Comment Deleted" });
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  }

  async getComments(request, response) {
    const tokenPayload = request.token;
    const postId = request.params.id;
    const username = tokenPayload.username;

    //Get all the comments on a post
    const query =
      "SELECT comments.id,comments.comment,comments.anonymous,comments.timestamp,comments.ratings, CASE WHEN comments.anonymous=true THEN NULL ELSE comments.author END FROM comments WHERE comments.postid=$1";

    try {
      let data = (await pool.query(query, [postId])).rows;

      //Get all the commentIds of the current post which current user has liked
      if (
        request.token !== undefined &&
        request.token !== null &&
        request.token !== "undefined"
      ) {
        const token = request.token;
        const username = token.username;
        const commentsLikedByUserQuery =
          "SELECT commentratings.commentid AS commentid, commentratings.rating FROM commentratings WHERE commentratings.username=$1 AND commentratings.postid=$2";

        const commentsLikedByUserData = (
          await pool.query(commentsLikedByUserQuery, [username, postId])
        ).rows;
        data = [...data, { commentsLiked: commentsLikedByUserData }];

        return data;
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async postComment(request, response) {
    const tokenPayload = request.token;
    const author = tokenPayload.username;

    let { comment, anonymous, postId } = request.body;

    const query =
      "INSERT INTO comments (comment,author,anonymous,postid,timestamp) VALUES ($1,$2,$3,$4,$5)";

    const timestamp = moment.utc().format("ddd MMM DD YYYY HH:mm:ss z");

    pool
      .query(query, [comment, author, anonymous, postId, timestamp])
      .then(() => {
        return response
          .status(201)
          .json({ type: "success", msg: "Commented succesfully" });
      })
      .catch((error) => {
        console.log(error);
        return response.status(500).json({ type: "error", msg: error });
      });
  }

  async updateComment(request, response) {
    const tokenPayload = request.token;
    const author = tokenPayload.username;

    const { commentId, anonymous, postId, comment } = request.body;

    const query =
      "UPDATE comments SET comment=$1, anonymous=$2, edited=true WHERE comments.id=$3";

    try {
      await pool.query(query, [comment, anonymous, commentId]);
      return response
        .status(201)
        .json({ type: "success", msg: "Comment updated succesfully" });
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  }

  async updatePost(request, response) {
    const tokenPayload = request.token;
    const postId = request.params.id;
    const author = tokenPayload.username;
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
      "UPDATE posts SET title=$1, description=$2, anonymous=$3, tags=$4, media=media||$5, edited=true WHERE posts.id=$6 AND author=$7";

    try {
      await pool.query(query, [
        title,
        description,
        anonymous,
        tags,
        images,
        postId,
        author,
      ]);
      return response
        .status(201)
        .json({ type: "success", msg: "Post updated succesfully" });
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  }
}

module.exports = {
  PostController,
};
