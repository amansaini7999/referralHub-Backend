const firebase = require("../db");

const isAuth = (request, response, next) => {
  const headerToken = request.headers.authorization;
  if (!headerToken) {
    return response.status(401).send({ message: "Not authenticated" });
  }

  if (headerToken && headerToken.split(" ")[0] !== "Bearer") {
    return response.status(401).send({ message: "Invalid token" });
  }

  const token = headerToken.split(" ")[1];
  firebase
    .auth()
    .verifyIdToken(token)
    .then(() => next())
    .catch(() => response.status(403).send({ message: "Could not authorize" }));
};

module.exports = isAuth;
