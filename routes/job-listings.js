const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  postNewJob,
  getJobListings,
  postReferral,
  getJob
} = require("../controllers/job-listings");
const isAuth = require("../middleware/is-auth");

////POST route for posting new job-listing and adding it in job-listings collection
router.post(
  "/addjob",
  isAuth,
  check("company", "company name is not present").not().isEmpty(),
  postNewJob
);

////
router.get("/", getJobListings);

router.get("/:jobid",getJob);

////POST request to request referral
router.post("/requestReferral", isAuth, postReferral);

module.exports = router;
