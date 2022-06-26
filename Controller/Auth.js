const pool = require("../Config/Database");
require("dotenv").config();
const { genSalt, hash, compare } = require("bcrypt");
const { sign, verify } = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { CLIENT_URL } = require("../Constants");
const nodemailer = require("nodemailer");
const xoauth2 = require("xoauth2");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GMAIL_EMAIL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: process.env.ACCESS_TOKEN,
  },
});

class AuthController {
  async signUp(request, response) {
    const { username, email, password } = request.body;

    //Verification & Availability Checks
    if (!username || !email || !password) {
      return response.status(400).json({ msg: "All fields are required" });
    }

    const emailExistsQuery = "SELECT * FROM users WHERE email=$1";

    const emailExists = await (
      await pool.query(emailExistsQuery, [email])
    ).rows[0];

    const usernameExistsQuery = "SELECT * FROM users WHERE username=$1";

    const usernameExists = await (
      await pool.query(usernameExistsQuery, [username])
    ).rows[0];

    if (emailExists) {
      return response
        .status(400)
        .json({ msg: "This email has already in use" });
    }

    if (usernameExists) {
      return response.status(400).json({ msg: "This username already exists" });
    }

    //Create User
    const query =
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)";

    const salt = await genSalt(18);
    const hashedPassword = await hash(password, salt);
    pool
      .query(query, [username, email, hashedPassword])
      .then(() => {
        this.sendVerificationEmail({ username, email }, transporter);

        return response
          .status(201)
          .json({ msg: "Account created succesfully" });
      })
      .catch((error) => {
        console.log(error);
        return response.status(500).json(error);
      });
  }

  async signIn(request, response) {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ msg: "All fields are required" });
    }

    const query = "SELECT * FROM users WHERE email=$1";
    const user = await (await pool.query(query, [email])).rows[0];

    if (!user) {
      return response
        .status(404)
        .json({ msg: "Accout with this email does not exist" });
    }

    const verified = user.verified;

    if (!verified) {
      return response
        .status(404)
        .json({ msg: "Please verify your email-ID. Check your mail inbox" });
    }
    const hashedPassword = user.password;
    const isPasswordValid = await compare(password, hashedPassword);

    if (!isPasswordValid) {
      return response.status(400).json({ msg: "Invalid password" });
    }
    const token_payload = {
      username: user.username,
      email: user.email,
    };
    const token = sign(token_payload, process.env.cookie_secret, {
      expiresIn: "30d",
    });
    return response
      .status(200)
      .json({ token, username: user.username, email: user.email });
  }

  sendVerificationEmail(user, transporter) {
    const newId = uuidv4();
    const token_payload = {
      username: user.username,
      email: user.email,
      randomId: newId,
    };

    sign(
      token_payload,
      process.env.email_secret,
      {
        expiresIn: "1d",
      },
      (err, emailToken) => {
        try {
          const emaiVerificationURL = `http://localhost:5000/verifyemail/${emailToken}`;

          transporter.sendMail({
            to: user.email,
            subject: "Confirm Email",
            html: `Please click this link to confirm your email: <a href="${emaiVerificationURL}">Here</a>`,
          });
        } catch (error) {
          console.log(error);
        }
      }
    );
  }

  async verifyEmail(request, response) {
    try {
      const { username, email, id } = verify(
        request.params.token,
        process.env.email_secret
      );

      const query = "UPDATE users SET verified = true WHERE email=$1";

      await pool.query(query, [email]);

      response.redirect(`${CLIENT_URL}/verfied`);
    } catch (error) {
      console.log(error);
      response.redirect(`${CLIENT_URL}/`);
    }
  }
}

module.exports = {
  AuthController,
};
