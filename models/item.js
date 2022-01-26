const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: mongoose.Decimal128,
      required: true
    }
  }
);

module.exports = Item = mongoose.model("menus", itemSchema);
