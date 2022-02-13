const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: String,
      required: true
    },
    priceID: {
      type: String,
      required: true
    }
  }
);

module.exports = Item = mongoose.model("menus", itemSchema);
