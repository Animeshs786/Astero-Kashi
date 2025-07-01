const mongoose = require("mongoose");

const requestMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dob: String,
  birthTime: String,
  placeOfBirth: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const RequestMember = new mongoose.model("RequestMember", requestMemberSchema);
module.exports = RequestMember;
