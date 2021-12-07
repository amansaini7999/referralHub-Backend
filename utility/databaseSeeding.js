const firebase = require("../db");
const firestore = firebase.firestore();
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const fs = require("fs");
const path = require("path");

exports.databaseSeed = () => {
  const users = [];
  const jobListings = [];
  const jobCreatedBy = [0, 4, 4, 8, 8, 8, 0, 7, 4, 8];
  const referralRelation = {
    microsoft: {
      whoRequested: [1, 3, 5, 7],
      whoReferred: [null, null, 2, 2],
      jobId: [0, 6, 9, 0],
    },
    google: {
      whoRequested: [0, 1, 6, 7, 3],
      whoReferred: [null, null, 4, 8, null],
      jobId: [1, 1, 5, 1, 5],
    },
    cisco: {
      whoRequested: [1, 3, 6, 5],
      whoReferred: [null, null, null, 7],
      jobId: [2, 2, 2, 2],
    },
    flipkart: {
      whoRequested: [1, 3],
      whoReferred: [null, 0],
      jobId: [3, 3],
    },
  };
  const auth = getAuth();
  const createUsers = async () => {
    const emails = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/fakeEmail.json"))
    ).data;
    for (let i in emails) {
      try {
        let user = await createUserWithEmailAndPassword(
          auth,
          emails[i].email,
          emails[i].password
        );
        users.push(user.user.uid);
      } catch (err) {
        break;
      }
    }
  };

  createUsers().then(async () => {
    let userSnapshot = await firestore.collection("users").get();
    if (userSnapshot.empty) {
      let file = fs.readFileSync(path.join(__dirname, "../data/users.json"));
      file = JSON.parse(file);
      for (let userIndex in file.data) {
        await firestore
          .collection("users")
          .doc(users[userIndex])
          .set(file.data[userIndex]);
      }
    }
    const jobListingSnapshot = await firestore.collection("job-listings").get();
    if (jobListingSnapshot.empty) {
      let file = fs.readFileSync(
        path.join(__dirname, "../data/job-listing.json")
      );
      file = JSON.parse(file);
      for (let index in file.data) {
        let jobListing = file.data[index];
        jobListing = {
          ...jobListing,
          postedBy: firestore.doc("users/" + users[jobCreatedBy[index]]),
        };
        jobListing.datePosted = new Date(jobListing.datePosted);
        jobListing = await firestore.collection("job-listings").add(jobListing);
        jobListings.push(jobListing.id);
      }
    }
    const referralSnapshot = await firestore.collection("referral").get();
    if (referralSnapshot.empty) {
      let file = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../data/referral.json"))
      );
      for (let company in referralRelation) {
        for (let i = 0; i < file[company].length; i++) {
          file[company][i] = {
            ...file[company][i],
            candidate: firestore.doc(
              "users/" + users[referralRelation[company].whoRequested[i]]
            ),
            jobReference: firestore.doc(
              "job-listings/" + jobListings[referralRelation[company].jobId[i]]
            ),
            referredBy:
              referralRelation[company].whoReferred[i] == null
                ? null
                : firestore.doc(
                    "users/" + users[referralRelation[company].whoReferred[i]]
                  ),
          };
        }
      }
      for (const key in file) {
        const doc = {
          company: key,
          data: file[key],
        };
        await firestore.collection("referral").doc(key).set(doc);
      }
    }
  });
};
