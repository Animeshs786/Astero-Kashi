const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema({
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
  totalAmount: { type: Number, required: true },
  totalCommission: { type: Number, required: true },
  gstCharge:{type:Number,required:true},
  totalSettlementAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },invoice:{
    type:String,
    default:""
  },
  remark: {
    type: String,
    default: "",
  },
  receiptImage: String,
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  settledAt: { type: Date },
});

const Settlement = mongoose.model("Settlement", settlementSchema);
module.exports = Settlement;
