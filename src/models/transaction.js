const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  astrologer:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  invoice:{
    type:String,
    defaule:""
  },
  type: {
    type:String,
    enum: ["walletRecharge","chat","video"],
    required: true,
  },
  duration:{
    type:String,
    default:""
  },
   isSettled: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
