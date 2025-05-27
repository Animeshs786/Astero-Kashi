const mongoose = require("mongoose");
const astrologerSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  mobile: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline",
  },
  isBusy:{
    type:Boolean,
    default:false
  },
  profileImage: String,
  about: {
    type: String,
  },
  language: [String],
  experience: {
    type: Number,
    default: 0,
  },
  speciality: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Speciality",
    },
  ],
  commission: {
    type: Number,
    default: 0,
  },
  pricing: {
    chat: { type: Number, default: 10 }, // per minute
    voice: { type: Number, default: 15 },
    video: { type: Number, default: 20 },
  },
  wallet: {
    balance: { type: Number, default: 0 },
    lockedBalance: { type: Number, default: 0 },
  },
  services: {
    chat: { type: Boolean, default: true },
    voice: { type: Boolean, default: true },
    video: { type: Boolean, default: true },
  },
  isBlock: {
    type: Boolean,
    default: false,
  },
  bankName: {
    type: String,
  },
  ifscCode: String,

  accountNumber: {
    type: String,
  },
  gstNumber: {
    type: String,
  },
  state: String,
  city: String,
  address: String,
  documentImage: [String],
  isVerify: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Astrologer = mongoose.model("Astrologer", astrologerSchema);
module.exports = Astrologer;
