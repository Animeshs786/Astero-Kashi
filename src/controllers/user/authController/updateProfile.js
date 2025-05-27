const { isValidObjectId } = require("mongoose");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const User = require("../../../models/user");
const deleteOldFiles = require("../../../utils/deleteOldFiles");

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { name, email, mobile, dob, gender, status } = req.body;
  const obj = {};
  const id = req.user._id;

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid id", 400));
  }

  if (email) {
    const user = await User.findOne({ email: email, _id: { $ne: id } });
    if (user) {
      return next(new AppError("Email already exists", 400));
    }
  }

  if (mobile) {
    const user = await User.findOne({ mobile: mobile, _id: { $ne: id } });
    if (user) {
      return next(new AppError("Mobile number already exists", 400));
    }
  }

  if (name) obj.name = name;
  if (email) obj.email = email;
  if (mobile) obj.mobile = mobile;
  if (dob) obj.dob = new Date(dob);
  if (gender) obj.gender = gender;
  if (status !== undefined) obj.status = status;

  let profileImagePath;

  try {
    if (req.files && req.files.profileImage) {
      const url = `${req.files.profileImage[0].destination}/${req.files.profileImage[0].filename}`;
      obj.profileImage = url;
      profileImagePath = url;

      // Delete old profile image if exists
      const user = await User.findById(id);
      if (user.profileImage) {
        await deleteOldFiles(user.profileImage).catch((err) => {
          console.error("Failed to delete old profile image:", err);
        });
      }
    }

    const user = await User.findByIdAndUpdate(id, obj, {
      new: true,
      runValidators: true,
    }).select("-otp");

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    if (profileImagePath) {
      await deleteOldFiles(profileImagePath).catch((err) => {
        console.error("Failed to delete profile image:", err);
      });
    }
    return next(error);
  }
});
