const express = require("express");
require("dotenv").config();
const AuthRoutes = require("./Routes/Auth");
const PostRoutes = require("./Routes/Post");
const UserRoutes = require("./Routes/User");
var bodyParser = require("body-parser");
var cors = require("cors");
const { Migrations } = require("./Migration/migration");

const Migration = new Migrations();

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(AuthRoutes);
app.use(PostRoutes);
app.use(UserRoutes);

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  Migration.fullTextSearch();
  Migration.anonymousUser();
  console.log(`Listening at port: ${PORT}`);
});
