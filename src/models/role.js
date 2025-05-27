const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permission: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Permission",
  }],
  createdAt: { type: Date, default: Date.now },
});

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
