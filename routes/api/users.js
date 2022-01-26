const express = require("express");
const Router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const keys = require("../../config/keys");

const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
const checkAuth = require("../../validation/auth").checkAuth;

const User = require("../../models/user");

Router.post("/register", (req, res) => {
  const {errors, isValid} = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User
    .findOne({email: req.body.email})
    .then(user => {
      if (user && user.active == true) {
        return res.status(400).json({email: "Email already used."});
      } else {
        const newUser = new User(
          {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
          }
        );

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              throw err;
            }

            newUser.password = hash;
            newUser
              .save()
              .then(() => res.status(200).json({message: "Account created."}))
              .catch(err => console.log(err));
          });
        });
      }
    });
});

Router.post("/verify", (req, res) => {
  const email = req.body.email;
  const key = req.body.key;

  User.findOne({email}).then(user => {
    if (user.key == key) {
      user.key = undefined;
      user.active = true;
      user
        .save()
        .then(() => res.status(200).json({message: "Account verified."}))
        .catch(err => console.log(err));
    } else {
      res.status(400).json({message: "Invalid key."});
    }
  });
});

Router.post("/login", (req, res) => {
  const {errors, isValid} = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  User.findOne({email}).then(user => {
    if (!user) {
      return res.status(404).json({emailnotfound: "Email not found"});
    }

    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        const payload = {
          id: user.id,
          name: user.name
        };

        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.status(200).json({
              success: true,
              id: payload.id,
              token: `${token}`
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({wrongcredential: "Wrong credentials."});
      }
    });
  });
});

Router.get("/profile", checkAuth, (req, res) => {
  User
    .findOne({_id: req.user.id})
    .then(user => {
      if (user) {
        return res.status(200).json(user);
      } else {
        return res.status(404).json({usernotfound: "User not found"});
      }
    });
});

module.exports = Router;
