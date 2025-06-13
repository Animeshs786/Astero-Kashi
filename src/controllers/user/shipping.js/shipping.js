const Shipping = require("../../../models/shipping"); 
const User = require("../../../models/user"); 
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createShipping = catchAsync(async (req, res, next) => {
  const {
    name,
    mobile,
    address,
    city,
    state,
    pincode,
    landmark,
    alternateNumber,
    addressType,
  } = req.body;
  const userId = req.user._id;

  console.log(req.body, "body");

  // Validate required fields
  if (
    !name ||
    !mobile ||
    !address ||
    !city ||
    !state ||
    pincode === undefined ||
    !landmark
  ) {
    return next(
      new AppError(
        "Name, mobile, address, city, state, pincode, and landmark are required",
        400
      )
    );
  }

  // Validate mobile (10-digit Indian format)
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return next(
      new AppError("Mobile number must be a valid 10-digit Indian number", 400)
    );
  }

  // Validate alternateNumber if provided
  if (alternateNumber && !/^[6-9]\d{9}$/.test(alternateNumber)) {
    return next(
      new AppError(
        "Alternate number must be a valid 10-digit Indian number",
        400
      )
    );
  }

  // Validate pincode (6-digit format)
  if (!/^\d{6}$/.test(pincode.toString())) {
    return next(new AppError("Pincode must be a 6-digit number", 400));
  }

  // Validate user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const shippingData = {
    name,
    mobile,
    address,
    city,
    state,
    pincode: parseInt(pincode),
    landmark,
    alternateNumber: alternateNumber || undefined,
    addressType: addressType || undefined,
    user: userId,
  };

  try {
    const newShipping = await Shipping.create(shippingData);

    res.status(201).json({
      status: true,
      message: "Shipping address created successfully",
      data: newShipping,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllShippings = catchAsync(async (req, res) => {
  const { page: currentPage, limit: currentLimit } = req.query;
  const userId = req.user._id;

  let query = { user: userId }; // Restrict to authenticated user's shipping addresses

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Shipping,
    null,
    query
  );

  const shippings = await Shipping.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Shipping addresses fetched successfully",
    data: shippings,
  });
});

exports.getShipping = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const shipping = await Shipping.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!shipping) {
    return next(new AppError("Shipping address not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Shipping address fetched successfully",
    data: shipping,
  });
});

exports.updateShipping = catchAsync(async (req, res, next) => {
  const {
    name,
    mobile,
    address,
    city,
    state,
    pincode,
    landmark,
    alternateNumber,
    addressType,
  } = req.body;
  const userId = req.user._id;

  console.log(req.body, "body");
  const shipping = await Shipping.findById(req.params.id);

  if (!shipping) {
    return next(new AppError("Shipping address not found", 404));
  }

 
  // Validate mobile if provided
  if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
    return next(
      new AppError("Mobile number must be a valid 10-digit Indian number", 400)
    );
  }

  // Validate alternateNumber if provided
  if (alternateNumber && !/^[6-9]\d{9}$/.test(alternateNumber)) {
    return next(
      new AppError(
        "Alternate number must be a valid 10-digit Indian number",
        400
      )
    );
  }

  // Validate pincode if provided
  if (pincode !== undefined && !/^\d{6}$/.test(pincode.toString())) {
    return next(new AppError("Pincode must be a 6-digit number", 400));
  }

  const shippingData = {};

  if (name) shippingData.name = name;
  if (mobile) shippingData.mobile = mobile;
  if (address) shippingData.address = address;
  if (city) shippingData.city = city;
  if (state) shippingData.state = state;
  if (pincode !== undefined) shippingData.pincode = parseInt(pincode);
  if (landmark) shippingData.landmark = landmark;
  if (alternateNumber !== undefined)
    shippingData.alternateNumber = alternateNumber;
  if (addressType !== undefined) shippingData.addressType = addressType;

  try {
    const updatedShipping = await Shipping.findByIdAndUpdate(
      req.params.id,
      shippingData,
      { new: true, runValidators: true }
    ).populate("user", "name email");

    res.status(200).json({
      status: true,
      message: "Shipping address updated successfully",
      data: updatedShipping,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deleteShipping = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const shipping = await Shipping.findById(req.params.id);

  if (!shipping) {
    return next(new AppError("Shipping address not found", 404));
  }


  await Shipping.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Shipping address deleted successfully",
    data: null,
  });
});
