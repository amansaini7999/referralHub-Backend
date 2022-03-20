const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  postAddUser,
  getUserData,
  editUserData,
  getOwnUser,
  getUserSecData
} = require("../controllers/users");
const isAuth = require("../middleware/is-auth");

router.get('/',(req,res) => {
  res.send(
    "welcome to users"
  )
});


////POST route to add the user data to firestore
router.post(
  "/addUser",
  isAuth,
  check("name", "name is required").isLength({ min: 2 }),
  postAddUser
);

router.get('/getUser', isAuth, getOwnUser);

////GET route to fetch user data from firestore
router.get("/getUser/:userId", getUserData);
router.get("/getUserSec/:userId", getUserSecData);

////POST route to edit user details in firestore
router.patch(
  "/editUser",
  isAuth,
  check("name", "name is required").isLength({ min: 2 }),
  editUserData
);

module.exports = router;
