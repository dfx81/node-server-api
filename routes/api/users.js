const express = require("express");
const Router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailer = require("nodemailer");

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
            email: req.body.email,
            password: req.body.password,
            key: Math.floor(Math.random() * (1000000 - 100000) + 100000)
          }
        );

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              throw err;
            }

            newUser.password = hash;
            console.log(newUser._id.toString());
            newUser
              .save()
              .then(async () => {
                let transporter = mailer.createTransport(keys.mailConfig);
                let info = await transporter.sendMail({
                  from: "'DSara Burger' <admin@dsara.com>",
                  to: newUser.email,
                  subject: "Verify Account",
                  html: `<span>Activate your account <a href="${keys.domain}/api/users/verify?id=${newUser._id.toString()}&key=${newUser.key}">here</a>.</span>`
                });

                console.log("Message sent: %s", info.messageId);
                console.log("Preview URL: %s", mailer.getTestMessageUrl(info));

                res.status(200).json({message: "Account created. Please check your email for activation link."});
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
});

Router.get("/verify", (req, res) => {
  const id = req.query.id;
  const key = req.query.key;

  User.findById(id).then(user => {
    if (user.key == key && user.active == false) {
      user.key = undefined;
      user.active = true;
      user
        .save()
        .then(() => res.status(200).send("Account verified."))
        .catch(err => console.log(err));
    } else {
      res.status(400).send("Bad session.");
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
      return res.status(404).json({message: "Email not found"});
    }

    if (!user.active) {
      return res.status(404).json({message: "Activate the account via email first."});
    }

    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        const payload = {
          id: user.id
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
          .json({message: "Wrong credentials."});
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
        return res.status(404).json({message: "User not found"});
      }
    });
});

module.exports = Router;
