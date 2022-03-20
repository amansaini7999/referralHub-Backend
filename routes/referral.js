const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/is-auth");
const {
  getReferralByCompany,
  getReferralByJob,
  giveFeedback,
  giveReferral,
  rejectReferral
} = require("../controllers/referral");

// router.get('/',isAuth,getReferral);

router.get('/company',isAuth,getReferralByCompany);
router.get('/job',isAuth,getReferralByJob);
router.patch('/feedbackreferral',isAuth,giveFeedback);
router.patch('/referreferral',isAuth,giveReferral);
router.patch('/rejectreferral',isAuth,rejectReferral);

module.exports = router;
