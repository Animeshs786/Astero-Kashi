const mongoose = require("mongoose");

const poojaTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    default: "",
  },
  orderId: {
    type: String,
    default: "",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pooja: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pooja",
    required: true,
  },
  PaymentMethod: {
    type: String,
    enum: ["online", "cod"],
    default: "cod",
    required: true,
  },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  poojaStatus: {
    type: String,
    enum: ["booked", "cancel", "complete"],
    default: "booked",
  },
  amount: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  isSettled: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PoojaTransaction = mongoose.model(
  "PoojaTransaction",
  poojaTransactionSchema
);
module.exports = PoojaTransaction;
