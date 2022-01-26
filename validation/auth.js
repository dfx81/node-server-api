const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

exports.checkAuth = function(req, res, next) {
  const token = req.body.token || req.query.token || req.headers["x-access-token"];

  if (token) {
    try {
      const decoded = jwt.verify(token, keys.secretOrKey);
      req.user = decoded;
    } catch (err) {
      return res.status(401).json({message: "Session expired."});
    }

    return next();
  } else {
    res.status(401).json({message: "Not authorized."});
  }
};

exports.checkAdmin = function(req, res, next) {
  if (req.user.id == keys.owner) {
    return next();
  } else {
    return res.status(401).json({message: "Admin only."});
  }
}
