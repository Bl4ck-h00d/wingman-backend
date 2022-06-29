const express = require("express");
require("dotenv").config();
const AuthRoutes = require("./Routes/Auth");
const PostRoutes = require("./Routes/Post");
var bodyParser = require("body-parser");
var cors = require("cors");
const { SetupFullTextSearch } = require("./Migration/Search");

const Migration = new SetupFullTextSearch();

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(AuthRoutes);
app.use(PostRoutes);

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  Migration.up();
  console.log(`Listening at port: ${PORT}`);
});
