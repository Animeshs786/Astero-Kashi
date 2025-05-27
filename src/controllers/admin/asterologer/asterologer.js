const Astrologer = require("../../../models/asteroLogerSchema");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createAstrologer = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    mobile,
    status = "offline",
    about,
    language,
    experience = 0,
    speciality,
    commission,
    pricing,
    services,
    isBlock = false,
    bankName,
    ifscCode,
    accountNumber,
    gstNumber,
    state,
    city,
    address,
    isVerify = false,
  } = req.body;
  let profileImagePath;
  let documentImagePaths = [];

  console.log(req.body, "body");

  if (!name || !email || !mobile) {
    return next(new AppError("Name, email, and mobile are required", 400));
  }

  // Check for duplicate email
  const existingEmail = await Astrologer.findOne({
    email: { $regex: `^${email}$`, $options: "i" },
  });
  if (existingEmail) {
    return next(new AppError("Email must be unique", 400));
  }

  // Check for duplicate mobile
  const existingMobile = await Astrologer.findOne({ mobile });
  if (existingMobile) {
    return next(new AppError("Mobile number must be unique", 400));
  }

  const astrologerData = {
    name,
    email,
    mobile,
    status,
    about,
    language: language ? JSON.parse(language) : [],
    experience,
    speciality: speciality ? JSON.parse(speciality) : [],
    commission,
    pricing: pricing ? JSON.parse(pricing) : { chat: 10, voice: 15, video: 20 },
    services: services
      ? JSON.parse(services)
      : { chat: true, voice: true, video: true },
    isBlock,
    bankName,
    ifscCode,
    accountNumber,
    gstNumber,
    state,
    city,
    address,
    isVerify,
  };

  try {
    // Handle profile image
    if (req.files && req.files.profileImage) {
      const profileImage = req.files.profileImage[0];
      const imageUrl = `${profileImage.destination}/${profileImage.filename}`;
      astrologerData.profileImage = imageUrl;
      profileImagePath = imageUrl;
    }

    // Handle document images
    if (req.files && req.files.documentImage) {
      astrologerData.documentImage = req.files.documentImage.map(
        (file) => `${file.destination}/${file.filename}`
      );
      documentImagePaths = astrologerData.documentImage;
    }

    const newAstrologer = await Astrologer.create(astrologerData);

    res.status(201).json({
      status: true,
      message: "Astrologer created successfully",
      data: newAstrologer,
    });
  } catch (error) {
    // Clean up uploaded profile image
    if (profileImagePath) {
      await deleteOldFiles(profileImagePath).catch((err) => {
        console.error("Failed to delete profile image:", err);
      });
    }
    // Clean up uploaded document images
    if (documentImagePaths.length > 0) {
      await Promise.all(
        documentImagePaths.map((path) =>
          deleteOldFiles(path).catch((err) => {
            console.error("Failed to delete document image:", err);
          })
        )
      );
    }
    return next(error);
  }
});

exports.getAllAstrologers = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Astrologer,
    null,
    query
  );

  const astrologers = await Astrologer.find(query)
    .populate("speciality")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Astrologers fetched successfully",
    data: astrologers,
  });
});

exports.getAstrologer = catchAsync(async (req, res, next) => {
  const astrologer = await Astrologer.findById(req.params.id).populate(
    "speciality"
  );

  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Astrologer fetched successfully",
    data: astrologer,
  });
});

exports.updateAstrologer = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    mobile,
    status,
    about,
    language,
    experience,
    speciality,
    commission,
    pricing,
    services,
    isBlock,
    bankName,
    ifscCode,
    accountNumber,
    gstNumber,
    state,
    city,
    address,
    isVerify,
  } = req.body;

  console.log(req.body, "body");
  let profileImagePath;
  let documentImagePaths = [];
  const astrologer = await Astrologer.findById(req.params.id);

  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  // Check for duplicate email (excluding current astrologer)
  if (email && email !== astrologer.email) {
    const existingEmail = await Astrologer.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });
    if (existingEmail) {
      return next(new AppError("Email must be unique", 400));
    }
  }

  // Check for duplicate mobile (excluding current astrologer)
  if (mobile && mobile !== astrologer.mobile) {
    const existingMobile = await Astrologer.findOne({
      mobile,
      _id: { $ne: req.params.id },
    });
    if (existingMobile) {
      return next(new AppError("Mobile number must be unique", 400));
    }
  }

  const astrologerData = {};

  if (name) astrologerData.name = name;
  if (email) astrologerData.email = email;
  if (mobile) astrologerData.mobile = mobile;
  if (status) astrologerData.status = status;
  if (about) astrologerData.about = about;
  if (language)
    astrologerData.language = language.split(",").map((lang) => lang.trim());
  if (experience !== undefined) astrologerData.experience = experience;
  if (speciality) {
    astrologerData.speciality = speciality ? JSON.parse(speciality) : [];
  }
  if (language) {
    astrologerData.language = language ? JSON.parse(language) : [];
  }
  if (commission) astrologerData.commission = commission;
  if (pricing) astrologerData.pricing = JSON.parse(pricing);
  if (services) astrologerData.services = JSON.parse(services);
  if (isBlock !== undefined) astrologerData.isBlock = isBlock;
  if (bankName) astrologerData.bankName = bankName;
  if (ifscCode) astrologerData.ifscCode = ifscCode;
  if (accountNumber) astrologerData.accountNumber = accountNumber;
  if (gstNumber) astrologerData.gstNumber = gstNumber;
  if (state) astrologerData.state = state;
  if (city) astrologerData.city = city;
  if (address) astrologerData.address = address;
  if (isVerify !== undefined) astrologerData.isVerify = isVerify;

  try {
    // Handle profile image
    if (req.files && req.files.profileImage) {
      const profileImage = req.files.profileImage[0];
      const imageUrl = `${profileImage.destination}/${profileImage.filename}`;
      astrologerData.profileImage = imageUrl;
      profileImagePath = imageUrl;

      // Delete old profile image if exists
      if (astrologer.profileImage) {
        await deleteOldFiles(astrologer.profileImage).catch((err) => {
          console.error("Failed to delete old profile image:", err);
        });
      }
    }

    // Handle document images
    if (req.files && req.files.documentImage) {
      astrologerData.documentImage = req.files.documentImage.map(
        (file) => `${file.destination}/${file.filename}`
      );
      documentImagePaths = astrologerData.documentImage;

      // Delete old document images if exists
      if (astrologer.documentImage && astrologer.documentImage.length > 0) {
        await Promise.all(
          astrologer.documentImage.map((path) =>
            deleteOldFiles(path).catch((err) => {
              console.error("Failed to delete old document image:", err);
            })
          )
        );
      }
    }

    const updatedAstrologer = await Astrologer.findByIdAndUpdate(
      req.params.id,
      astrologerData,
      { new: true, runValidators: true }
    ).populate("speciality");

    res.status(200).json({
      status: true,
      message: "Astrologer updated successfully",
      data: updatedAstrologer,
    });
  } catch (error) {
    // Clean up uploaded profile image
    if (profileImagePath) {
      await deleteOldFiles(profileImagePath).catch((err) => {
        console.error("Failed to delete profile image:", err);
      });
    }
    // Clean up uploaded document images
    if (documentImagePaths.length > 0) {
      await Promise.all(
        documentImagePaths.map((path) =>
          deleteOldFiles(path).catch((err) => {
            console.error("Failed to delete document image:", err);
          })
        )
      );
    }
    return next(error);
  }
});

exports.deleteAstrologer = catchAsync(async (req, res, next) => {
  const astrologer = await Astrologer.findById(req.params.id);

  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  // Delete associated profile image if exists
  if (astrologer.profileImage) {
    await deleteOldFiles(astrologer.profileImage).catch((err) => {
      console.error("Failed to delete profile image:", err);
    });
  }

  await Astrologer.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Astrologer deleted successfully",
    data: null,
  });
});
