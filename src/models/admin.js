const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const adminSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "Username must be required."],
      unique: [true, "User name already exist."],
    },
    email: {
      type: String,
      required: [true, "Email must be required."],
      unique: [true, "Email already exist."],
      validate: [validator.isEmail, "Email should not be valid."],
    },
    password: {
      type: String,
      select: false,
      required: [true, "Password must be required."],
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    profileImage: String,
    passwordUpdatedAt: Date,
    passwordResetToken: String,
    passwordTokenExpiry: Date,
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// hash user password
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//instence method for comparing the password
adminSchema.methods.comparePassword = async function (currentPassword) {
  return await bcrypt.compare(currentPassword, this.password);
};

//validate jwt token create time
adminSchema.methods.validatePasswordUpdate = async function (tokenTimestamp) {
  if (this.passwordUpdatedAt) {
    const updateTimestamp = parseInt(
      this.passwordUpdatedAt.getTime() / 1000,
      10
    );
    return tokenTimestamp < updateTimestamp;
  }
  return false;
};

adminSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(64).toString("hex");
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.passwordResetToken = passwordResetToken;
  this.passwordTokenExpiry = Date.now() + 10 * 60 * 1000;
  return token;
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
