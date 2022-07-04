const pool = require("../Config/Database");
require("dotenv").config();

class UserController {
  async getUser(request, response) {
    const user = request.params.username;

    //Get posts by user
    const postQuery =
      "SELECT posts.id,posts.author, posts.media,posts.edited, posts.title,posts.description,posts.timestamp,posts.tags,posts.ratings, COUNT(comments.comment) AS comments FROM posts LEFT JOIN comments ON posts.id=comments.postId WHERE posts.author=$1 GROUP BY posts.id";

    const data = (await pool.query(postQuery, [user])).rows;

    let responseData = [{ posts: [...data] }];
    const commentQuery =
      "SELECT comments.id,comments.postid, comments.author,comments.comment,comments.timestamp,comments.edited,comments.ratings FROM comments WHERE comments.author=$1";

    const comments = (await pool.query(commentQuery, [user])).rows;

    responseData = [...responseData, { comments: comments }];

    if (
      request.token !== undefined &&
      request.token !== null &&
      request.token !== "undefined"
    ) {
      const token = request.token;
      const username = token.username;

      if (user !== undefined && user !== null && user === username) {
        const postsSavedByUserQuery =
          "SELECT posts.id,posts.author, posts.media,posts.edited, posts.title,posts.description,posts.timestamp,posts.tags,posts.ratings, COUNT(comments.comment) AS comments FROM posts INNER JOIN savedpost ON posts.id=savedpost.postid LEFT JOIN comments ON posts.id=comments.postId WHERE savedpost.username=$1 GROUP BY posts.id";

        const postsSavedByUserData = (
          await pool.query(postsSavedByUserQuery, [username])
        ).rows;
        responseData = [...responseData, { postsSaved: postsSavedByUserData }];

        const anonymousPostsQuery =
          "SELECT posts.id, posts.media,posts.edited, posts.title,posts.description,posts.timestamp,posts.tags,posts.ratings, COUNT(comments.comment) AS comments,anonymousposts.author FROM posts INNER JOIN anonymousposts ON posts.id=anonymousposts.postid LEFT JOIN comments ON posts.id=comments.postId WHERE anonymousposts.author=$1 GROUP BY posts.id,anonymousposts.author";

        const anonymousPostsByUserData = (
          await pool.query(anonymousPostsQuery, [username])
        ).rows;
        responseData = [
          ...responseData,
          { anonymousPostsByUser: anonymousPostsByUserData },
        ];
      }
    }

    return response.status(200).json(responseData);
  }
  catch(error) {
    console.log(error);
    return response.status(500).json({ type: "error", msg: error });
  }
}

module.exports = {
  UserController,
};
