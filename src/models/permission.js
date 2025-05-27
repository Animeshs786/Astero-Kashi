const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  sectionName: {
    type: String,
  },
  isSection:{
    type: Boolean,
    default: false,

  },
  isCreate: {
    type: Boolean,
    default: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isUpdate: {
    type: Boolean,
    default: false,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Permission = mongoose.model("Permission", permissionSchema);
module.exports = Permission;
