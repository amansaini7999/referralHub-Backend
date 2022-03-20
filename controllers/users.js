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
      return res.send({
        message: "User data already exists",
        isReferee: user.data().isReferee
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
    data.job_posted = [];
    data.referral_feedback = [];
    data.job_requested = [];
    data.profile_pic = req.user.pic;
    data.user_id = req.user.user_id;
    await firestore.collection("users").doc(req.user.user_id).set(data);
    res.status(201).send({
      message: "User added successfully",
      isReferee: data.isReferee
    });
  } catch (err) {
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};

exports.getOwnUser = async (req, res, next) => {
  // console.log(req.params.userId);
  try {
    const user = await firestore
      .collection("users")
      .doc(req.user.user_id)
      .get();
    if (!user.exists) {
      return res.status(404).send({
        message: "User data does not exists",
      });
    }
    let userData = {
      name: user.data().name,
      phone_number: user.data().phone_number,
      resume_link: user.data().resume_link,
      email: user.data().email
    };
    userData.user_id = req.user.user_id;
    // console.log("send user data");
    res.send(userData).status(200);
  } catch (err) {
    // console.log(err);
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
    let userGenData = {
      institute: user.data().institute,
      cgpa: user.data().cgpa,
      current_company: user.data().current_company,
      work_experience: user.data().work_experience,
      resume_link: user.data().resume_link,
      job_role: user.data().job_role,
      branch: user.data().branch,
      phone_number: user.data().phone_number,
      codeforces: user.data().codeforces,
      isReferee: user.data().isReferee,
      infotext: user.data().infotext,
      codechef: user.data().codechef,
      graduating_year: user.data().graduating_year,
      name: user.data().name,
      email: user.data().email,
      github: user.data().github,
      leetcode: user.data().leetcode,
      linkedin: user.data().linkedin,
      profile_pic: user.data().profile_pic
    }
    const userData = {
      general: userGenData
    }
    userData.user_id = req.params.userId;
    res.send(userData).status(200);
    
    
  } catch (err) {
    // console.log(err);
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};

exports.getUserSecData = async (req,res) => {
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
    let jobPosted = [];
    let referralFeedback = [];
    const job_posted = user.data().job_posted;
    for(let i = job_posted.length - 1 ; i>=0 ; i--){
      let data ={
        id: job_posted[i].jobReference.id
      }
      let valid = true;
      // console.log(data);
      await firestore.collection('job-listings').doc(job_posted[i].jobReference.id).get().then((snap) => {
        if(snap.exists){
          const job = snap.data();
          data.company= job.company;
          data.jobId= job.jobId;
          data.isActive= job.isActive;
        }
        else{
          valid = false;
        }
      })
      // console.log(data);
      if(valid){
        jobPosted.push(data);
      }
      if(jobPosted.length >= 20)
      {
        break;
      }
    }
    const referral_feedback = user.data().referral_feedback;
    // console.log(referral_feedback);
    for(let i = referral_feedback.length -1 ;i>=0;i--)
    {
      let job= {};
      let givenBy ={};
      let valid = true;
      await firestore.collection('job-listings').doc(referral_feedback[i].jobref.id).get().then((snap) => {
        // const j = snap.data();
        if(snap.exists){
          job.company = snap.data().company;
          job.jobId = snap.data().jobId;
        }
        else{
          valid = false;
        }
      })
      await firestore.collection('users').doc(referral_feedback[i].givenBy.id).get().then((snap ) => {
        // const g = snap.data();
        if(snap.exists){
         givenBy.name = snap.data().name;}
        else{
          valid = false;
        }
      })

      // console.log(job);
      if(!valid){
        continue;
      }

      const data ={
        type : referral_feedback[i].type,
        msg: referral_feedback[i].msg,
        company: job.company,
        jobId: job.jobId,
        id: referral_feedback[i].jobref.id,
        givenBy: givenBy.name,
        givenById: referral_feedback[i].givenBy.id
      }
      referralFeedback.push(data);
      if(referralFeedback.length >= 10)
      {
        break;
      }
    }
    res.send({
      jobPosted: jobPosted,
      referralFeedback: referralFeedback
    })
    
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
}

////Editing user details
exports.editUserData = async (req, res, next) => {
  // console.log(req.body);
  try {
    const user = await firestore
      .collection("users")
      .doc(req.user.user_id)
      .get();
    if (!user.exists) {
      // console.log("first");
      return res.status(404).send({
        message: "User data does not exists",
      });
    }
    // console.log(user.data.email);
    req.body.email=req.user.email;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(errors.array()[0].msg);
      return res.status(400).send({
        error: errors.array()[0].msg,
      });
    }
    let data = req.body;
    // console.log(data);
    await firestore.collection("users").doc(req.user.user_id).update(data);
    res.status(201).send({
      message: "User data edited successfully",
    });
  } catch (err) {
    // console.log("third");

    res.status(500).send({
      message: "Internal error occurred",
      error: err,
    });
  }
};
