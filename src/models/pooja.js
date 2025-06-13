const mongoose = require("mongoose");

const poojaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    default: "",
  },
  about: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  benefits: [String],
  assignAstrologer: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignAstrologer",
    },
  ],
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});
const Pooja = mongoose.model("Pooja", poojaSchema);
module.exports = Pooja;
