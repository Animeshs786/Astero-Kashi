const mongoose = require("mongoose");

const compatibilityDataSchema = new mongoose.Schema({
  signPair: {
    type: String,
    required: [true, "signPair is required"],
    unique: true,
    match: /^[A-Z][a-z]+-[A-Z][a-z]+$/, // e.g., Aries-Taurus
  },
  compatibility: {
    love: {
      percentage: { type: Number, required: true, min: 0, max: 100 },
      description: { type: String, required: true },
    },
    sexual: {
      percentage: { type: Number, required: true, min: 0, max: 100 },
      description: { type: String, required: true },
    },
    friendship: {
      percentage: { type: Number, required: true, min: 0, max: 100 },
      description: { type: String, required: true },
    },
    communication: {
      percentage: { type: Number, required: true, min: 0, max: 100 },
      description: { type: String, required: true },
    },
    relationshipTips: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

const CompatibilityData = mongoose.model(
  "CompatibilityData",
  compatibilityDataSchema
);
module.exports = CompatibilityData;
