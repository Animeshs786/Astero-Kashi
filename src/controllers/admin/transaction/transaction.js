const Transaction = require("../../../models/transaction");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getTransactionHistory = catchAsync(async (req, res, next) => {
  const {
    userId,
    status,
    type,
    startDate,
    endDate,
    search,
    page: currentPage,
    limit: currentLimit,
  } = req.query;

  // Build query object
  let query = {};

  // Filter by userId if provided
  if (userId) {
    query.user = userId;
  }

  // Filter by status if provided
  if (status) {
    if (!["pending", "success", "failed"].includes(status)) {
      return next(new AppError("Invalid status value", 400));
    }
    query.status = status;
  }

  // Filter by type if provided
  if (type) {
    if (type !== "walletRecharge") {
      return next(new AppError("Invalid type value", 400));
    }
    query.type = type;
  }

  // Filter by date range if provided
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Search by description if provided
  if (search) {
    query.description = { $regex: search, $options: "i" };
  }

  // Apply pagination
  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Transaction,
    null,
    query
  );

  // Fetch transactions
  const transactions = await Transaction.find(query)
    .populate("user", "name email mobile")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Transaction history fetched successfully",
    data: transactions,
  });
});

exports.getTransation = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id).populate(
    "user",
    "name email mobile"
  ).populate(
    "astrologer",
    "name email mobile"
  );

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Transaction fetched successfully",
    data: transaction,
  });
});
