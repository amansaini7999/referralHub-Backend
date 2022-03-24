const firebaseAdmin = require("firebase-admin");
const firebase = require("firebase/app");
const config = require("./config");
/////***********This file is compulsory to add..... Should be downloaded from firebase and renamed as firebaseAdminSdk.json*********************/////////////
// var serviceAccount = require("./firebaseAdminSdk.json");
const db = firebaseAdmin.initializeApp({
  ...config.firebaseConfig,
  credential: firebaseAdmin.credential.cert({
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key?.replace(/\\n/g, '\n'),
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.client_x509_cert_url
  }
  ),
});
firebase.initializeApp(config.firebaseConfig);
module.exports = db;
