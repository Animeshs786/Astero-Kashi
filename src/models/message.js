const mongoose = require("mongoose");
// Message Schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel",
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "recipientModel",
  },
  senderModel: { type: String, required: true, enum: ["User", "Astrologer"] },
  recipientModel: {
    type: String,
    required: true,
    enum: ["User", "Astrologer"],
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  deletedForSender: { type: Boolean, default: false },
  deletedForRecipient: { type: Boolean, default: false },
  deletedForEveryone: { type: Boolean, default: false },
  chatSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession",
    required: true,
  },
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;