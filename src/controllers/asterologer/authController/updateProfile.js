const { isValidObjectId } = require("mongoose");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Astrologer = require("../../../models/asteroLogerSchema");
const deleteOldFiles = require("../../../utils/deleteOldFiles");

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { name, email, mobile, about, language, experience, commission, pricing, services, bankName, ifscCode, accountNumber, gstNumber, state, city, address, documentImage } = req.body;
  const obj = {};
  const id = req.user._id;

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid id", 400));
  }

  if (email) {
    const astrologer = await Astrologer.findOne({ email: email, _id: { $ne: id } });
    if (astrologer) {
      return next(new AppError("Email already exists", 400));
    }
  }

  if (mobile) {
    const astrologer = await Astrologer.findOne({ mobile: mobile, _id: { $ne: id } });
    if (astrologer) {
      return next(new AppError("Mobile number already exists", 400));
    }
  }

  if (name) obj.name = name;
  if (email) obj.email = email;
  if (mobile) obj.mobile = mobile;
  if (about) obj.about = about;
  if (language) obj.language = language;
  if (experience) obj.experience = experience;
  if (commission) obj.commission = commission;
  if (pricing) obj.pricing = pricing;
  if (services) obj.services = services;
  if (bankName) obj.bankName = bankName;
  if (ifscCode) obj.ifscCode = ifscCode;
  if (accountNumber) obj.accountNumber = accountNumber;
  if (gstNumber) obj.gstNumber = gstNumber;
  if (state) obj.state = state;
  if (city) obj.city = city;
  if (address) obj.address = address;
  if (documentImage) obj.documentImage = documentImage;

  let profileImagePath;

  try {
    if (req.files && req.files.profileImage) {
      const url = `${req.files.profileImage[0].destination}/${req.files.profileImage[0].filename}`;
      obj.profileImage = url;
      profileImagePath = url;

      // Delete old profile image if exists
      const astrologer = await Astrologer.findById(id);
      if (astrologer.profileImage) {
        await deleteOldFiles(astrologer.profileImage).catch((err) => {
          console.error("Failed to delete old profile image:", err);
        });
      }
    }

    const astrologer = await Astrologer.findByIdAndUpdate(id, obj, {
      new: true,
      runValidators: true,
    }).select("-otp");

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: astrologer,
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