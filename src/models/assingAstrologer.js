const mongoose = require("mongoose");

const assignAstrologerSchema = new mongoose.Schema({
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  pooja: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pooja",
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  sellPrice: {
    type: Number,
    default: 0,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
});
const AssignAstrologer = mongoose.model(
  "AssignAstrologer",
  assignAstrologerSchema
);
module.exports = AssignAstrologer;
