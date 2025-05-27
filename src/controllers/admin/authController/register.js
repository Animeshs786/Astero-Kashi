const Admin = require("../../../models/admin");
const catchAsync = require("../../../utils/catchAsync");
const createToken = require("../../../utils/createToken");
const deleteOldFiles = require("../../../utils/deleteOldFiles");

exports.register = catchAsync(async (req, res, next) => {
  const obj = {};
  obj.userName = req.body.userName;
  obj.password = req.body.password;
  obj.email = req.body.email;
  obj.role=req.body.role;

  let profileImagePath;

  try {
    if (req.files && req.files.profileImage) {
      const url = `${req.files.profileImage[0].destination}/${req.files.profileImage[0].filename}`;
      obj.profileImage = url;
      profileImagePath = url;
    }

    const newUser = await Admin.create(obj);
    newUser.password = undefined;
    createToken(newUser, 201, res);
  } catch (error) {
    if (profileImagePath) {
      await deleteOldFiles(profileImagePath).catch((err) => {
        console.error("Failed to delete profile image:", err);
      });
    }
    return next(error);
  }
});
