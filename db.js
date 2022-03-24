const firebaseAdmin = require("firebase-admin");
const firebase = require("firebase/app");
const config = require("./config");
/////***********This file is compulsory to add..... Should be downloaded from firebase and renamed as firebaseAdminSdk.json*********************/////////////
// var serviceAccount = require("./firebaseAdminSdk.json");
const db = firebaseAdmin.initializeApp({
  ...config.firebaseConfig,
  credential: firebaseAdmin.credential.cert({
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
  }
  ),
});
firebase.initializeApp(config.firebaseConfig);
module.exports = db;
