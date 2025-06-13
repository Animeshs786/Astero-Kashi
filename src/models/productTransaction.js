const mongoose = require("mongoose");

const productTransactionSchema = new mongoose.Schema({
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
  shipping: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shipping",
    required: true,
  },
  deliverStatus: {
    type: String,
    enum: ["pending", "dispatched", "delivered", "cancelled"],
    default: "pending",
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  PaymentMethod: {
    type: String,
    enum: ["online", "cod"],
    default: "cod",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  gstAmount:{
    type:Number,
    default:0
  },
  referralCode: {
    type: String,
    default: "",
  },
  referralAmount: {
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
const ProductTransaction = mongoose.model(
  "ProductTransaction",
  productTransactionSchema
);
module.exports = ProductTransaction;
