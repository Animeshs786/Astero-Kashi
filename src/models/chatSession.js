const mongoose = require("mongoose");

// Chat Session Schema
const chatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  chatRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRequest",
    required: true,
  },
  type: {
    type: String,
    enum: ["chat", "video"],
    default: "chat",
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  status: { type: String, enum: ["active", "ended"], default: "active" },
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
module.exports = ChatSession;
