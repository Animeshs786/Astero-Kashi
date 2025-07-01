const RequestMember = require("../../../models/requestMember");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createRequestMember = catchAsync(async (req, res, next) => {
  const { name, gender, dob, birthTime, placeOfBirth } = req.body;

  const user = req.user._id;
  // Validate required fields
  if (!name || !gender || !user) {
    return next(new AppError("Name, gender, and user are required", 400));
  }

  // Validate gender enum
  if (!["male", "female", "other"].includes(gender)) {
    return next(new AppError("Gender must be male, female, or other", 400));
  }

  // Check for duplicate member (same name, dob, and user)
  if (name && user && dob) {
    const existingMember = await RequestMember.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      user,
      dob,
    });
    if (existingMember) {
      return next(
        new AppError(
          "A member with this name and date of birth already exists for this user",
          400
        )
      );
    }
  }

  const requestMemberData = {
    name,
    gender,
    user,
    dob,
    birthTime,
    placeOfBirth,
  };

  try {
    const newRequestMember = await RequestMember.create(requestMemberData);

    // Populate user for response
    await newRequestMember.populate("user");

    res.status(201).json({
      status: true,
      message: "Request member created successfully",
      data: newRequestMember,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllRequestMembers = catchAsync(async (req, res, next) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;
  const user = req.user._id;
  console.log(user,"user")
  let query = { user };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { gender: { $regex: search, $options: "i" } },
      { dob: { $regex: search, $options: "i" } },
      { birthTime: { $regex: search, $options: "i" } },
      { placeOfBirth: { $regex: search, $options: "i" } },
    ];
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    RequestMember,
    null,
    query
  );

  const requestMembers = await RequestMember.find(query)
    .populate({
      path: "user",
      match: search ? { name: { $regex: search, $options: "i" } } : {},
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Filter out null results from population
  const filteredRequestMembers = requestMembers.filter((member) => member.user);

  res.status(200).json({
    status: true,
    totalResult: filteredRequestMembers.length,
    totalPage: Math.ceil(filteredRequestMembers.length / limit),
    message: "Request members fetched successfully",
    data: filteredRequestMembers,
  });
});

exports.getRequestMember = catchAsync(async (req, res, next) => {
  const requestMember = await RequestMember.findById(req.params.id).populate(
    "user"
  );

  if (!requestMember) {
    return next(new AppError("Request member not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Request member fetched successfully",
    data: requestMember,
  });
});

exports.updateRequestMember = catchAsync(async (req, res, next) => {
  const { name, gender, dob, birthTime, placeOfBirth } = req.body;

  const user = req.user._id;
  const requestMember = await RequestMember.findById(req.params.id);

  if (!requestMember) {
    return next(new AppError("Request member not found", 404));
  }

  // Validate gender enum if provided
  if (gender && !["male", "female", "other"].includes(gender)) {
    return next(new AppError("Gender must be male, female, or other", 400));
  }

  // Check for duplicate member if updating name, user, or dob
  if (name || user || dob) {
    const checkName = name || requestMember.name;
    const checkUser = user || requestMember.user;
    const checkDob = dob || requestMember.dob;

    const existingMember = await RequestMember.findOne({
      name: { $regex: `^${checkName}$`, $options: "i" },
      user: checkUser,
      dob: checkDob,
      _id: { $ne: req.params.id },
    });

    if (existingMember) {
      return next(
        new AppError(
          "A member with this name and date of birth already exists for this user",
          400
        )
      );
    }
  }

  const requestMemberData = {};

  if (name) requestMemberData.name = name;
  if (gender) requestMemberData.gender = gender;
  if (user) requestMemberData.user = user;
  if (dob) requestMemberData.dob = dob;
  if (birthTime) requestMemberData.birthTime = birthTime;
  if (placeOfBirth) requestMemberData.placeOfBirth = placeOfBirth;

  try {
    const updatedRequestMember = await RequestMember.findByIdAndUpdate(
      req.params.id,
      requestMemberData,
      { new: true, runValidators: true }
    ).populate("user");

    res.status(200).json({
      status: true,
      message: "Request member updated successfully",
      data: updatedRequestMember,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deleteRequestMember = catchAsync(async (req, res, next) => {
  const requestMember = await RequestMember.findById(req.params.id);

  if (!requestMember) {
    return next(new AppError("Request member not found", 404));
  }

  await RequestMember.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Request member deleted successfully",
    data: null,
  });
});
