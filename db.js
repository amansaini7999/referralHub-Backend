const firebaseAdmin = require("firebase-admin");
const firebase = require("firebase/app");
const config = require("./config");
/////***********This file is compulsory to add..... Should be downloaded from firebase and renamed as firebaseAdminSdk.json*********************/////////////
var serviceAccount = require("./firebaseAdminSdk.json");
const db = firebaseAdmin.initializeApp({
  ...config.firebaseConfig,
  credential: firebaseAdmin.credential.cert(serviceAccount),
});
firebase.initializeApp(config.firebaseConfig);
module.exports = db;
