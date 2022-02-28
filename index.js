const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const { databaseSeed } = require("./utility/databaseSeeding");

const userRoutes = require("./routes/users");
const jobListingRoutes = require("./routes/job-listings");

const app = express();

app.use(bodyParser.json());
app.use(require("cors")());

app.use('/home',(req,res)=>{
  res.send("Welcome to the server");
})
app.use('/users', userRoutes);
app.use('/jobListings', jobListingRoutes);

if (process.env.NODE_ENV == "development") {
  databaseSeed();
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server Running on Port: http://localhost:${PORT}`));
