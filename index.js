const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const { databaseSeed } = require("./utility/databaseSeeding");

const userRoutes = require("./routes/users");

const app = express();

app.use(bodyParser.json());
app.use(require("cors")());

app.use("/", userRoutes);

if (process.env.NODE_ENV == "development") {
  databaseSeed();
}

app.listen(3000, () => {
  console.log("Server running at port 3000");
});
