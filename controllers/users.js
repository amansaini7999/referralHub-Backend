const firebase = require("../db");
const firestore = firebase.firestore();
const { validationResult } = require("express-validator");

////Adding user data to the database after signup
exports.postAddUser = async (req, res, next) => {
  try {
    const user = await firestore
      .collection("users")
      .doc(req.user.user_id)
      .get();
    if (user.exists) {
      // console.log("user exists");
      return res.status(403).send({
        message: "User data already exists",
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({
        error: errors.array()[0].msg,
      });
    }
    let data = req.body;
    // console.log(data);
    await firestore.collection("users").doc(req.user.user_id).set(data);
    res.status(201).send({
      message: "User added successfully",
    });
  } catch (err) {
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};

////Getting user data from firestore
exports.getUserData = async (req, res, next) => {
  // console.log(req.params.userId);
  try {
    const user = await firestore
      .collection("users")
      .doc(req.params.userId)
      .get();
    if (!user.exists) {
      return res.status(404).send({
        message: "User data does not exists",
      });
    }
    let userData = user.data();
    userData.user_id = req.params.userId;
    // console.log("send user data");
    res.send(userData).status(200);
  } catch (err) {
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};

////Editing user details
exports.editUserData = async (req, res, next) => {
  // console.log(req.body);
  try {
    const user = await firestore
      .collection("users")
      .doc(req.user.user_id)
      .get();
    if (!user.exists) {
      console.log("first");
      return res.status(404).send({
        message: "User data does not exists",
      });
    }
    // console.log(user.data.email);
    req.body.email=req.user.email;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array()[0].msg);
      return res.status(400).send({
        error: errors.array()[0].msg,
      });
    }
    let data = req.body;
    await firestore.collection("users").doc(req.user.user_id).set(data);
    res.status(201).send({
      message: "User data edited successfully",
    });
  } catch (err) {
    console.log("third");

    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};
