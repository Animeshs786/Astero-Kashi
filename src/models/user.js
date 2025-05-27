const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String },
  mobile: String,
  otp: {
    type: String,
    select: false,
  },
  otpExpiry: Date,
  profileImage: {
    type: String,
    default: "",
  },
  dob: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  wallet: {
    balance: { type: Number, default: 0 },
    lockedBalance: { type: Number, default: 0 },
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
