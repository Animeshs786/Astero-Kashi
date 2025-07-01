const mongoose = require("mongoose");
const astrologerSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  pincode: {
    type: Number,
  },
  city: String,
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
  otherPlatformWork: {
    type: Boolean,
    default: false,
  },
  qualification: {
    type: String,
  },
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline",
  },
  isBusy: {
    type: Boolean,
    default: false,
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
  poojaCommission: {
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
  fcmToken: {
    type: String,
    default: "",
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
  address: String,
  isExpert: {
    default: false,
    type: Boolean,
  },
  adharFrontImage: {
    type: String,
    default: "",
  },
  adharBackImage: {
    type: String,
    default: "",
  },
  panImage: {
    type: String,
    default: "",
  },
  bankPassbookImage: {
    type: String,
    default: "",
  },
  cancelChecqueImage: {
    type: String,
    default: "",
  },
  maxWaitingTime: {
    type: String,
    defautl: "",
  },
  referralCode: { type: String }, //it must be unique
  referralCommission: { type: Number, default: 0 }, //value calculate in percentage
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
