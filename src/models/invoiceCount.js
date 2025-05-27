const mongoose = require("mongoose");

const invoiceCountSchema = new mongoose.Schema({
  invoiceCount: {
    type: Number,
    default: 0,
  },
});
const InvoiceCount = mongoose.model("InvoiceCount", invoiceCountSchema);
module.exports = InvoiceCount;
