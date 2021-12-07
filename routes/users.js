const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { postAddUser } = require("../controllers/users");
const isAuth = require("../middleware/is-auth");

////POST route to add the user data to firestore
router.post(
  "/addUser",
  isAuth,
  check("firstName", "First name is required").isLength({ min: 2 }),
  postAddUser
);

module.exports = router;
