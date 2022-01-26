const express = require("express");
const Router = express.Router();

const checkAuth = require("../../validation/auth").checkAuth;
const checkAdmin = require("../../validation/auth").checkAdmin;

const Order = require("../../models/order");

Router.get("/", checkAuth, checkAdmin, (req, res) => {
  Order.find({}).then((orders) => {
    orderMap = {orders: []};

    if (orders.length) {
      orders.forEach((order) => orderMap.orders.push(order));
      res.status(200).json(orderMap);
    } else {
      res.status(404).json({message: "No orders found."});
    }
  });
});

Router.post("/", checkAuth, checkAdmin, (req, res) => {
  const id = req.body.id;

  Order.findOne({id}).then((order) => {
    if (order) {
      order.status = req.body.status;
      order.save();
      res.status(200).json({message: "Order status changed."});
    } else {
      res.status(404).json({message: "No order found."});
    }
  }).catch((err) => res.status(400).json({message: "Bad data."}));
});

Router.get("/cart", checkAuth, (req, res) => {
  const id = req.body.id;

  Order.findOne({id}).then((order) => {
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({message: "No order placed"});
    }
  });
});

Router.post("/cart", checkAuth, (req, res) => {
  const id = req.body.id;
  const data = req.body.data;

  Order.findOne({id}).then((order) => {
    if (order) {
      order.overwrite(data.json());
      order.save().then(() => res.status(200).json({message: "Order placed."}));
    } else {
      const order = new Order(data.json());
      order.save().then(() => res.status(200).json({message: "Order placed."}));
    }
  }).catch((err) => {
    console.log(err);
    res.status(400).json({message: "Bad data."});
  });
});

module.exports = Router;
