const firebase = require("../db");
const firestore = firebase.firestore();
const { validationResult } = require("express-validator");
const admin = require("firebase-admin");
const { async } = require("@firebase/util");

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
    data.requested_referral = [];
    data.isActive = true;
    let jobid;
    await firestore.collection("job-listings").add(data).then((docRef) =>{
      // console.log(docRef.id);
      jobid = docRef.id;
    });
    const jobReference = firestore.doc("job-listings/" + jobid);
    const userJobData = {jobReference: jobReference};
    await firestore.collection("users").doc(req.user.user_id).update({
      job_posted: admin.firestore.FieldValue.arrayUnion(userJobData)
    })
    res.status(201).json({
      jobid: jobid
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
    // console.log(lastJobId);
    let jobs;
    const pageSize = 3;
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
        jobs = await firestore
        .collection("job-listings")
        .orderBy("datePosted", "desc")
        .limit(pageSize + 1)
        .get();
      }
      else{
        jobs = await firestore
          .collection("job-listings")
          .orderBy("datePosted", "desc")
          .startAfter(lastJob)
          .limit(pageSize + 1)
          .get();
      }  
    }
    jobs = jobs.docs;
    // console.log(jobs);
    const hasNext = jobs.length == pageSize + 1 ? 1 : 0;
    if (jobs.length == pageSize + 1) {
      jobs.pop();
    }
    let jobListings = [];
    let lastId;
    for (let job of jobs) {
      lastId = job.id;
      let data = {
        id: job.id,
        company: job.data().company,
        datePosted: job.data().datePosted.toDate(),
        desc: job.data().desc
      };
      const postedBy = await firestore
        .collection("users")
        .doc(job.data().postedBy.id)
        .get();
      data.postedBy = {
        id: postedBy.id,
        name: postedBy.data().name,
        infotext: postedBy.data().infotext
        // lastName: postedBy.data().lastName,
      };
      data.jobId = job.data().jobId;
      data.jobLink = job.data().jobLink;
      jobListings.push(data);
    }
    res
      .send({
        data: jobListings,
        hasNext,
        lastId
      })
      .status(200);
  } catch (err) {
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};

exports.getJob = async (req,res) => {
  try{
    const job = await firestore
      .collection("job-listings")
      .doc(req.params.jobid)
      .get();
    if (!job.exists) {
      return res.status(404).send({
        message: "Job data does not exists",
      });
    }
    let jobData = job.data();
    jobData.id = req.params.jobid;
    // userData.user_id = req.params.userId;
    // console.log("send user data");
    const postedBy = await firestore
        .collection("users")
        .doc(job.data().postedBy.id)
        .get();
      jobData.postedBy = {
        id: postedBy.id,
        name: postedBy.data().name,
        infotext: postedBy.data().infotext
        // lastName: postedBy.data().lastName,
      };
    res.send(jobData).status(200);
  } catch(err) {
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
}

//// User requesting referral
exports.postReferral = async (req, res) => {
  try {
    let data = req.body;
    // console.log(data);
    if (!data.jobReference) {
      return res.status(400).send({
        message: "Job reference is not present",
      });
    }
    const jobId = data.jobReference;

    const job = await firestore
      .collection("job-listings")
      .doc(data.jobReference)
      .get();
    if (!job.exists) {
      return res.status(400).send({
        message: "Job does not exists",
      });
    }
    
    const user = await firestore.collection('users').doc(req.user.user_id).get();
    const userData = user.data();
    const job_requestedData = userData.job_requested;
    for(let reqjob of job_requestedData)
    {
      reqjob = reqjob.jobReference;
      // console.log(reqjob.id);
      if(reqjob.id === jobId)
      {
        return res.send({
          message: "You have already requested for this job"
        })
      }
    }
    

    
    data.jobReference = firestore.doc("job-listings/" + jobId);
    data.candidate = firestore.doc("users/" + req.user.user_id);
    data.nosRejected = 0;
    data.isActive = true;
    data.rejectedBy = [];
    const company = job.data().company;
    let ind = 0;
    await firestore
      .collection("referral")
      .doc(company)
      .get()
      .then((docSnapshot) => {
        if(docSnapshot.exists)
        {
          ind = docSnapshot.data().data.length;
          // console.log(ind);
          firestore.collection('referral').doc(company).update({
            data: admin.firestore.FieldValue.arrayUnion(data)
          });
        }
        else{
          const doc = {
            key: company,
            data: [data]
          }
          firestore.collection("referral").doc(company).set(doc);

        }
      })
      const refReference = firestore.doc('referral/' + company + '/data/' + ind);
      const jobReference = firestore.doc('job-listings/' + jobId);
      const userJobData = {jobReference: jobReference};
      const jobRefData = {refReference: refReference};

      await firestore.collection("users").doc(req.user.user_id).update({
        job_requested: admin.firestore.FieldValue.arrayUnion(userJobData)
      })
      await firestore.collection('job-listings').doc(jobId).update({
        requested_referral: admin.firestore.FieldValue.arrayUnion(jobRefData)
      })
    res.send({
      message: "Referral requested successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};
