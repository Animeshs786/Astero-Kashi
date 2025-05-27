const mongoose = require("mongoose");
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "",
  },
  image: String,
  priority: {
    type: Number,
    default: 1,
  },
  platform: {
    type: String,
    enum: ["web", "mobile", "both"],
    default: "both",
  },
  redirect: {
    type: String,
    enum: ["internal", "external"],
  },
  redirectUrl: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const 

Banner = new mongoose.model("Banner", bannerSchema);
module.exports = Banner;
