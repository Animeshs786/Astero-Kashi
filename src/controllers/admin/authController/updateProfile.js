const { isValidObjectId } = require("mongoose");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Admin = require("../../../models/admin"); // Assuming the admin model is defined
const deleteOldFiles = require("../../../utils/deleteOldFiles");

exports.updateAdminProfile = catchAsync(async (req, res, next) => {
  const { userName, email,role } = req.body;
  const obj = {};
  const id = req.user._id;
  console.log(req.body,"d")

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid id", 400));
  }

  if (email) {
    const admin = await Admin.findOne({ email: email, _id: { $ne: id } });
    if (admin) {
      return next(new AppError("Email already exists", 400));
    }
  }

  if (userName) {
    const admin = await Admin.findOne({ userName: userName, _id: { $ne: id } });
    if (admin) {
      return next(new AppError("Username already exists", 400));
    }
  }

  if (userName) obj.userName = userName;
  if (email) obj.email = email;
  if (role) obj.role= role

  let profileImagePath;

  try {
    if (req.files && req.files.profileImage) {
      const url = `${req.files.profileImage[0].destination}/${req.files.profileImage[0].filename}`;
      obj.profileImage = url;
      profileImagePath = url;

      // Delete old profile image if exists
      const admin = await Admin.findById(id);
      if (admin.profileImage) {
        await deleteOldFiles(admin.profileImage).catch((err) => {
          console.error("Failed to delete old profile image:", err);
        });
      }
    }

    const admin = await Admin.findByIdAndUpdate(id, obj, {
      new: true,
      runValidators: true,
    }).select("-password -passwordResetToken -passwordTokenExpiry");

    return res.status(200).json({
      status: true,
      message: "Admin profile updated successfully",
      data: admin,
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