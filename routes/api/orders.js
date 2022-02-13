const keys = require("../../config/keys");
const stripe = require("stripe")(keys.stripeKey);
const express = require("express");
const Router = express.Router();
const mailer = require("nodemailer");

const checkAuth = require("../../validation/auth").checkAuth;
const checkAdmin = require("../../validation/auth").checkAdmin;

const Order = require("../../models/order");
const User = require("../../models/user");

const transporter = mailer.createTransport(keys.mailConfig);

const endpointSecret = keys.stripeEndpoint;

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
      
      if (order.status == "DONE") {
        User.findById(id).then(async (user) => {
          let info = await transporter.sendMail({
            from: "'DSara Burger' <admin@dsara.com>",
            to: user.email,
            subject: "Order Ready",
            html: `<p>You can visit the burger stall to pickup your order.<br>Show this ID to claim your order: <b>${id}<b></p>`
          });

          console.log("Message sent: %s", info.messageId);
          console.log("Preview URL: %s", mailer.getTestMessageUrl(info));
        });
      }

      if (order.status == "COMPLETE") {
        Order.deleteOne({id}).then(() => console.log("Order deleted."));
      }

      res.status(200).json({message: "Order status changed."});
    } else {
      res.status(404).json({message: "No order found."});
    }
  }).catch((err) => res.status(400).json({message: "Bad data."}));
});

Router.get("/cart", checkAuth, (req, res) => {
  const id = req.user.id;

  Order.findOne({id}).then((order) => {
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({message: "No order placed"});
    }
  });
});

Router.post("/cart", checkAuth, (req, res) => {
  const data = req.body;
  const id = req.user.id;

  Order.findOne({id}).then((order) => {
    if (order) {
      if (order.status != "IN QUEUE") {
        order.overwrite(data);
        order.save().then(() => res.status(200).json({message: "Order updated."}));
      } else {
        res.status(400).json({message: "Only one order at a time."});
      }
    } else {
      const order = new Order(data);
      order.save().then(() => res.status(200).json({message: "Order placed."}));
    }
  }).catch((err) => {
    console.log(err);
    res.status(400).json({message: "Bad data."});
  });
});

Router.get("/cart/checkout", checkAuth, (req, res) => {
  const id = req.user.id;

  Order.findOne({id}).then(async (cart) => {
    if (cart) {
      cartItems = [];

      cart.order.forEach((val, i) => {
        cartItems.push({
          price: val.priceID,
          quantity: val.quantity
        });
      });

      console.log(cartItems);

      const session = await stripe.checkout.sessions.create({
        line_items: cartItems,
        mode: 'payment',
        success_url: `${keys.domain}/api/orders/cart/checkout/success`,
        cancel_url: `${keys.domain}/api/orders/cart/checkout/cancel`,
        metadata: {id: req.user.id}
      });

      res.redirect(303, session.url);
    } else {
      res.status(404).json({message: "No order available."});
    }
  });
});

Router.get("/cart/checkout/success", (req, res) => {
  res.send("Payment successful. You can return to the app.");
});

Router.post("/webhook", (req, res) => {
  const payload = req.body;
  /*const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    console.log(err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Fulfill the purchase...
  }
  */

  if (payload.type == "checkout.session.completed") {
    const id = payload.data.object.metadata.id;
    Order.findOne({id}).then((order) => {
      if (order) {
        order.status = "IN QUEUE";
        order.save();
      }

      res.status(200).json({message: "Order placed"});
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({message: "Bad data."});
    });
  }

  res.status(200);
})

Router.get("/cart/checkout/cancel", (req, res) => {
  res.send("Payment cancelled. You can return to the app.");
});

module.exports = Router;
