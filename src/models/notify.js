const mongoose = require("mongoose");
const notifySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["chat", "video", "voice"],
    default: "chat",
  },
  createdAt: { type: Date, default: Date.now },
});
const Notify = mongoose.model("Notify", notifySchema);
module.exports = Notify;
