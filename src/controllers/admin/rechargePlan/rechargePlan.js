const RechargePlan = require("../../../models/rechargePlan");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");


exports.createRechargePlan = catchAsync(async (req, res, next) => {
  const { rechargeAmount, offerType, offerValue } = req.body;

  if (!rechargeAmount || !offerValue) {
    return next(new AppError("Recharge amount and offer value are required", 400));
  }

  // Validate rechargeAmount and offerValue are positive numbers
  if (rechargeAmount <= 0 || offerValue <= 0) {
    return next(new AppError("Recharge amount and offer value must be positive numbers", 400));
  }

  // Check for duplicate rechargeAmount
  const existingRechargeAmount = await RechargePlan.findOne({ rechargeAmount });
  if (existingRechargeAmount) {
    return next(new AppError("Recharge amount already exists", 400));
  }

  const rechargePlanData = {
    rechargeAmount,
    offerType: offerType || "fixed",
    offerValue,
  };

  try {
    const newRechargePlan = await RechargePlan.create(rechargePlanData);

    res.status(201).json({
      status: true,
      message: "Recharge plan created successfully",
      data: newRechargePlan,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllRechargePlans = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};
  if (search) {
    query.$or = [
      { rechargeAmount: { $regex: search, $options: "i" } },
      { offerType: { $regex: search, $options: "i" } },
    ];
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    RechargePlan,
    null,
    query
  );

  const rechargePlans = await RechargePlan.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Recharge plans fetched successfully",
    data: rechargePlans,
  });
});

exports.getRechargePlan = catchAsync(async (req, res, next) => {
  const rechargePlan = await RechargePlan.findById(req.params.id);

  if (!rechargePlan) {
    return next(new AppError("Recharge plan not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Recharge plan fetched successfully",
    data: rechargePlan,
  });
});

exports.updateRechargePlan = catchAsync(async (req, res, next) => {
  const { rechargeAmount, offerType, offerValue } = req.body;

  const rechargePlan = await RechargePlan.findById(req.params.id);

  if (!rechargePlan) {
    return next(new AppError("Recharge plan not found", 404));
  }

  // Check for duplicate rechargeAmount (excluding current recharge plan)
  if (rechargeAmount !== undefined && rechargeAmount !== rechargePlan.rechargeAmount) {
    const existingRechargeAmount = await RechargePlan.findOne({
      rechargeAmount,
      _id: { $ne: req.params.id },
    });
    if (existingRechargeAmount) {
      return next(new AppError("Recharge amount already exists", 400));
    }
  }

  const rechargePlanData = {};

  if (rechargeAmount !== undefined) {
    if (rechargeAmount <= 0) {
      return next(new AppError("Recharge amount must be a positive number", 400));
    }
    rechargePlanData.rechargeAmount = rechargeAmount;
  }

  if (offerType) {
    rechargePlanData.offerType = offerType;
  }

  if (offerValue !== undefined) {
    if (offerValue <= 0) {
      return next(new AppError("Offer value must be a positive number", 400));
    }
    rechargePlanData.offerValue = offerValue;
  }

  try {
    const updatedRechargePlan = await RechargePlan.findByIdAndUpdate(
      req.params.id,
      rechargePlanData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Recharge plan updated successfully",
      data: updatedRechargePlan,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deleteRechargePlan = catchAsync(async (req, res, next) => {
  const rechargePlan = await RechargePlan.findById(req.params.id);

  if (!rechargePlan) {
    return next(new AppError("Recharge plan not found", 404));
  }

  await RechargePlan.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Recharge plan deleted successfully",
    data: null,
  });
});