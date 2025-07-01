const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Astrologer = require("../../../models/asteroLogerSchema");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const generateReferralCode = require("../../../utils/generateReferralCode");

exports.updateProfile = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    pincode,
    city,
    mobile,
    otherPlatformWork,
    qualification,
    status,
    isBusy,
    about,
    language,
    experience,
    speciality,
    commission,
    pricing,
    services,
    isBlock,
    fcmToken,
    bankName,
    ifscCode,
    accountNumber,
    gstNumber,
    state,
    address,
    isExpert,
    isVerify,
    referralCommission,
    poojaCommission,
  } = req.body;

  const id = req.user._id;

  const astrologer = await Astrologer.findById(id);
  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  // Check for duplicate email (excluding current astrologer)
  if (email && email !== astrologer.email) {
    const existingEmail = await Astrologer.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
      _id: { $ne: id },
    });
    if (existingEmail) {
      return next(new AppError("Email must be unique", 400));
    }
  }

  // Check for duplicate mobile (excluding current astrologer)
  if (mobile && mobile !== astrologer.mobile) {
    const existingMobile = await Astrologer.findOne({
      mobile,
      _id: { $ne: id },
    });
    if (existingMobile) {
      return next(new AppError("Mobile number must be unique", 400));
    }
  }

  const astrologerData = {};

  if (name !== undefined) astrologerData.name = name;
  if (email !== undefined) astrologerData.email = email;
  if (pincode !== undefined) astrologerData.pincode = Number(pincode);
  if (city !== undefined) astrologerData.city = city;
  if (mobile !== undefined) astrologerData.mobile = mobile;
  if (otherPlatformWork !== undefined)
    astrologerData.otherPlatformWork = Boolean(otherPlatformWork);
  if (qualification !== undefined) astrologerData.qualification = qualification;
  if (status !== undefined) astrologerData.status = status;
  if (isBusy !== undefined) astrologerData.isBusy = Boolean(isBusy);
  if (about !== undefined) astrologerData.about = about;
  if (language !== undefined)
    astrologerData.language = language ? JSON.parse(language) : [];
  if (experience !== undefined) astrologerData.experience = Number(experience);
  if (speciality !== undefined)
    astrologerData.speciality = speciality ? JSON.parse(speciality) : [];
  if (commission !== undefined) astrologerData.commission = Number(commission);
  if (pricing !== undefined)
    astrologerData.pricing = pricing ? JSON.parse(pricing) : undefined;
  if (services !== undefined)
    astrologerData.services = services ? JSON.parse(services) : undefined;
  if (isBlock !== undefined) astrologerData.isBlock = Boolean(isBlock);
  if (fcmToken !== undefined) astrologerData.fcmToken = fcmToken;
  if (bankName !== undefined) astrologerData.bankName = bankName;
  if (ifscCode !== undefined) astrologerData.ifscCode = ifscCode;
  if (accountNumber !== undefined) astrologerData.accountNumber = accountNumber;
  if (gstNumber !== undefined) astrologerData.gstNumber = gstNumber;
  if (state !== undefined) astrologerData.state = state;
  if (address !== undefined) astrologerData.address = address;
  if (isExpert !== undefined) astrologerData.isExpert = Boolean(isExpert);
  if (isVerify !== undefined) astrologerData.isVerify = Boolean(isVerify);
  if (referralCommission !== undefined)
    astrologerData.referralCommission = Number(referralCommission);
  if (poojaCommission !== undefined) {
    astrologerData.poojaCommission = Number(poojaCommission);
  }

  let imagePaths = {};
  let oldImagePaths = {};

  try {
    // Handle image uploads
    if (req.files) {
      if (req.files.profileImage) {
        astrologerData.profileImage = `${req.files.profileImage[0].destination}/${req.files.profileImage[0].filename}`;
        imagePaths.profileImage = astrologerData.profileImage;
        if (astrologer.profileImage)
          oldImagePaths.profileImage = astrologer.profileImage;
      }
      if (req.files.adharFrontImage) {
        astrologerData.adharFrontImage = `${req.files.adharFrontImage[0].destination}/${req.files.adharFrontImage[0].filename}`;
        imagePaths.adharFrontImage = astrologerData.adharFrontImage;
        if (astrologer.adharFrontImage)
          oldImagePaths.adharFrontImage = astrologer.adharFrontImage;
      }
      if (req.files.adharBackImage) {
        astrologerData.adharBackImage = `${req.files.adharBackImage[0].destination}/${req.files.adharBackImage[0].filename}`;
        imagePaths.adharBackImage = astrologerData.adharBackImage;
        if (astrologer.adharBackImage)
          oldImagePaths.adharBackImage = astrologer.adharBackImage;
      }
      if (req.files.panImage) {
        astrologerData.panImage = `${req.files.panImage[0].destination}/${req.files.panImage[0].filename}`;
        imagePaths.panImage = astrologerData.panImage;
        if (astrologer.panImage) oldImagePaths.panImage = astrologer.panImage;
      }
      if (req.files.bankPassbookImage) {
        astrologerData.bankPassbookImage = `${req.files.bankPassbookImage[0].destination}/${req.files.bankPassbookImage[0].filename}`;
        imagePaths.bankPassbookImage = astrologerData.bankPassbookImage;
        if (astrologer.bankPassbookImage)
          oldImagePaths.bankPassbookImage = astrologer.bankPassbookImage;
      }
      if (req.files.cancelChecqueImage) {
        astrologerData.cancelChecqueImage = `${req.files.cancelChecqueImage[0].destination}/${req.files.cancelChecqueImage[0].filename}`;
        imagePaths.cancelChecqueImage = astrologerData.cancelChecqueImage;
        if (astrologer.cancelChecqueImage)
          oldImagePaths.cancelChecqueImage = astrologer.cancelChecqueImage;
      }
    }

    if (!astrologer.referralCode) {
      astrologerData.referralCode =  await generateReferralCode(name);
    }

    const updatedAstrologer = await Astrologer.findByIdAndUpdate(
      id,
      astrologerData,
      { new: true, runValidators: true }
    ).populate("speciality");

    // Delete old images after successful update
    await Promise.all(
      Object.values(oldImagePaths).map((path) =>
        deleteOldFiles(path).catch((err) => {
          console.error(`Failed to delete old image ${path}:`, err);
        })
      )
    );

    res.status(200).json({
      status: true,
      message: "Astrologer updated successfully",
      data: updatedAstrologer,
    });
  } catch (error) {
    // Clean up new uploaded images
    await Promise.all(
      Object.values(imagePaths).map((path) =>
        deleteOldFiles(path).catch((err) => {
          console.error(`Failed to delete image ${path}:`, err);
        })
      )
    );
    return next(error);
  }
});
