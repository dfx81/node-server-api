const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      required: true,
      default: false
    },
    key: {
      type: Number,
      required: false
    }
  }
);

module.exports = User = mongoose.model("users", userSchema);
