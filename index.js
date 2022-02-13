const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");

const users = require("./routes/api/users");
const menus = require("./routes/api/menus");
const orders = require("./routes/api/orders");

const app = express();

app.use(
  bodyParser.urlencoded(
    {extended: false}
  )
);
app.use(bodyParser.json());
app.use(cors());

const db = require("./config/keys").mongoURI;

mongoose
  .connect(db, {useNewUrlParser: true})
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));

app.use(passport.initialize());
require("./config/passport")(passport);

app.use("/api/users", users);
app.use("/api/menus", menus);
app.use("/api/orders", orders);

const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Server running on port ${port}.`));
