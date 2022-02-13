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
    quantity: {
      type: Number,
      required: true
    },
    priceID: {
      type: String,
      required: true
    }
  }
);

const orderSchema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    total: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    time: {
      type: Number,
      required: true
    },
    order: [itemSchema]
  }
);

module.exports = Order = mongoose.model("orders", orderSchema);
