const firebase = require("../db");
const firestore = firebase.firestore();
const { validationResult } = require("express-validator");
const admin = require("firebase-admin");

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

exports.getJobListings = async (req, res, next) => {
  try {
    const { lastJobId } = req.query;
    let jobs;
    const pageSize = 2;
    if (!lastJobId) {
      jobs = await firestore
        .collection("job-listings")
        .orderBy("datePosted", "desc")
        .limit(pageSize + 1)
        .get();
    } else {
      const lastJob = await firestore
        .collection("job-listings")
        .doc(lastJobId)
        .get();
      if (!lastJob.exists) {
        return res.status(400).send({
          message: "Job does not exists",
        });
      }
      jobs = await firestore
        .collection("job-listings")
        .orderBy("datePosted", "desc")
        .startAfter(lastJob)
        .limit(pageSize + 1)
        .get();
    }
    jobs = jobs.docs;
    const hasNext = jobs.length == pageSize + 1 ? 1 : 0;
    if (jobs.length == pageSize + 1) {
      jobs.pop();
    }
    let jobListings = [];
    for (let job of jobs) {
      let data = {
        id: job.id,
        company: job.data().company,
        datePosted: job.data().datePosted.toDate(),
      };
      const postedBy = await firestore
        .collection("users")
        .doc(job.data().postedBy.id)
        .get();
      data.postedBy = {
        id: postedBy.id,
        firstName: postedBy.data().firstName,
        lastName: postedBy.data().lastName,
      };
      if (job.data().jobId) {
        data.jobId = job.data().jobId;
      } else {
        data.jobLink = job.data().jobId;
      }
      jobListings.push(data);
    }
    res
      .send({
        data: jobListings,
        hasNext,
      })
      .status(200);
  } catch (err) {
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};

//// User requesting referral
exports.postReferral = async (req, res) => {
  try {
    let data = req.body;
    if (!data.jobReference) {
      return res.status(400).send({
        message: "Job reference is not present",
      });
    }
    const job = await firestore
      .collection("job-listings")
      .doc(data.jobReference)
      .get();
    if (!job.exists) {
      return res.status(400).send({
        message: "Job does not exists",
      });
    }
    data.jobReference = firestore.doc("job-listings/" + data.jobReference);
    data.candidate = firestore.doc("users/" + req.user.user_id);
    data.nosRejected = 0;
    const company = job.data().company;
    await firestore
      .collection("referral")
      .doc(company)
      .update({
        data: admin.firestore.FieldValue.arrayUnion(data),
      });
    res.send({
      message: "Referral is requested successfully",
    });
  } catch (err) {
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};
