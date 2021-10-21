const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");


const app = express();


app.get("/",(req,res)=>{
    return res.status(200).send("testing");
});

app.get("/referral-hub",(req,res)=>{
    return res.send("This is referaal hub route");
})


// exporting api to firebase cloud function

exports.app = functions.https.onRequest(app);