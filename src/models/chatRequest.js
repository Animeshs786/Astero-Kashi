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
    enum: ["pending", "accept", "reject", "notRespond"],
    default: "pending",
  },
  memberData: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true,
      },
      dob: String,
      birthTime: String,
      placeOfBirth: String,
    },
  ],
  type: {
    type: String,
    enum: ["chat", "video", "voice"],
    default: "chat",
  },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
});

const ChatRequest = mongoose.model("ChatRequest", chatRequestSchema);

module.exports = ChatRequest;
