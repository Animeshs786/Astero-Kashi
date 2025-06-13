const PoojaTransaction = require("../../../models/poojaTransaction");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllPoojaTransactions = catchAsync(async (req, res) => {
  const { page: currentPage, limit: currentLimit, userId } = req.query;

  let query = {}; // Restrict to authenticated user's transactions

  if (userId) {
    query.user = userId;
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    PoojaTransaction,
    null,
    query
  );

  const transactions = await PoojaTransaction.find(query)
    .populate("user", "name email")
    .populate("pooja", "name sellPrice")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Pooja transactions fetched successfully",
    data: transactions,
  });
});

exports.getPoojaTransaction = catchAsync(async (req, res, next) => {
  const transaction = await PoojaTransaction.findById(req.params.id)
    .populate("user", "name email")
    .populate("pooja", "name sellPrice");

  if (!transaction) {
    return next(new AppError("Pooja transaction not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Pooja transaction fetched successfully",
    data: transaction,
  });
});

exports.updatePoojaTransaction = catchAsync(async (req, res, next) => {
  const { boojaStatus } = req.body;

  const transaction = await PoojaTransaction.findById(req.params.id);

  if (!transaction) {
    return next(new AppError("Pooja transaction not found", 404));
  }

  transaction.poojaStatus = boojaStatus;
  await transaction.save();
  res.status(200).json({
    status: true,
    message: "Pooja transaction updated successfully",
    data: transaction,
  });
});
