const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  mobile: {
    type: String,
    require: true,
  },
  address: {
    type: String,
    require: true,
  },
  city: {
    type: String,
    require: true,
  },
  state: {
    type: String,
    require: true,
  },
  pincode: {
    type: Number,
    require: true,
  },
  landmark: {
    type: String,
    require: true,
  },
  alternateNumber: {
    type: String,
  },
  addressType: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Shipping = mongoose.model("Shipping", shippingSchema);
module.exports = Shipping;
