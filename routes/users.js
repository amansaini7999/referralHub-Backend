const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  postAddUser,
  getUserData,
  editUserData,
} = require("../controllers/users");
const isAuth = require("../middleware/is-auth");

////POST route to add the user data to firestore
router.post(
  "/addUser",
  isAuth,
  check("firstName", "First name is required").isLength({ min: 2 }),
  postAddUser
);

////GET route to fetch user data from firestore
router.get("/getUser", isAuth, getUserData);

////POST route to edit user details in firestore
router.post(
  "/editUser",
  isAuth,
  check("firstName", "First name is required").isLength({ min: 2 }),
  editUserData
);

module.exports = router;
