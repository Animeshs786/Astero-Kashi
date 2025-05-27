const mongoose = require("mongoose");

const specialitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
const Speciality = mongoose.model("Speciality", specialitySchema);
module.exports = Speciality;
