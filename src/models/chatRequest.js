const mongoose = require("mongoose");

const chatRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accept", "reject","notRespond"],
    default: "pending",
  },
  type: {
    type: String,
    enum: ["chat", "video","voice"],
    default: "chat",
  },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
});

const ChatRequest = mongoose.model("ChatRequest", chatRequestSchema);

module.exports = ChatRequest;
