const express = require("express");
const Router = express.Router();

const checkAuth = require("../../validation/auth").checkAuth;

const Item = require("../../models/item");

Router.get("/", checkAuth, (req, res) => {
  Item.find({}).then((items) => {
    menuMap = {menus: []};

    if (items) {
      items.forEach((item) => menuMap.menus.push(item));
      res.status(200).json(menuMap);
    } else {
      res.status(404).json({message: "No menus found."});
    }
  });
});

module.exports = Router;
