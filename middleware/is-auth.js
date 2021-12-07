const firebase = require("../db");

const isAuth = (req, res, next) => {
  const headerToken = req.headers.authorization;
  if (!headerToken) {
    return res.status(401).send({ message: "Not authenticated" });
  }

  if (headerToken && headerToken.split(" ")[0] !== "Bearer") {
    return res.status(401).send({ message: "Invalid token" });
  }

  const token = headerToken.split(" ")[1];
  firebase
    .auth()
    .verifyIdToken(token)
    .then((result) => {
      req.user = {
        user_id: result.user_id,
        email: result.email,
      };
      next();
    })
    .catch((err) => res.status(403).send({ message: "Could not authorize" }));
};

module.exports = isAuth;
