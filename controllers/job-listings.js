const firebase = require("../db");
const firestore = firebase.firestore();
const { validationResult } = require("express-validator");

////Posting new job-listing
exports.postNewJob = async (req, res, next) => {
  try {
    let data = req.body;
    if (data.jobId == undefined && data.jobLink == undefined) {
      return res.status(400).send({
        message: "jobId/jobLink is not present",
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({
        error: errors.array()[0].msg,
      });
    }
    data.datePosted = new Date();
    data.postedBy = firestore.doc("users/" + req.user.user_id);
    await firestore.collection("job-listings").add(data);
    res.status(201).send({
      message: "Job added successfully",
    });
  } catch (err) {
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};
