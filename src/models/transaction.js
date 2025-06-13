const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  orderId:{
    type:String,
    default:""
  },
  transactionId:{
    type:String,
    default:""
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
    enum: ["walletRecharge","chat","video","voice"],
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
