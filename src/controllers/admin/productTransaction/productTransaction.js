const Astrologer = require("../../../models/asteroLogerSchema");
const ProductTransaction = require("../../../models/productTransaction");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllProductTransactions = catchAsync(async (req, res) => {
  const { page: currentPage, limit: currentLimit } = req.query;
  const userId=req.query.userId

  let query = { }; // Restrict to authenticated user's transactions
  if (userId) {
    query.user = userId;
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ProductTransaction,
    null,
    query
  );

  const transactions = await ProductTransaction.find(query)
    .populate("user", "name email")
    .populate("shipping", "name address city state pincode")
    .populate("product", "name sellPrice")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Transactions fetched successfully",
    data: transactions,
  });
});

exports.getProductTransaction = catchAsync(async (req, res, next) => {
  const transaction = await ProductTransaction.findById(req.params.id)
    .populate("user", "name email")
    .populate("shipping")
    .populate("product");

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Transaction fetched successfully",
    data: transaction,
  });
});

exports.updateProductTransaction = catchAsync(async (req, res, next) => {
  const { deliverStatus } = req.body;

  console.log(req.body, "body");

  const transaction = await ProductTransaction.findById(req.params.id);
  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  const transactionData = {};

  // Allow updating deliverStatus
  if (deliverStatus) {
    if (!["pending", "dispatched", "delivered", "cancelled"].includes(deliverStatus)) {
      return next(new AppError("Invalid deliverStatus value", 400));
    }
    transactionData.deliverStatus = deliverStatus;

    // Handle referral commission when product is delivered
    if (deliverStatus === "delivered" && transaction.referralCode) {
      const astrologer = await Astrologer.findOne({ referralCode: transaction.referralCode });
      if (!astrologer) {
        console.warn(`Astrologer not found for referralCode: ${transaction.referralCode}`);
      } else {
        // Calculate referral amount (commission is in percentage)
        const referralCommission = astrologer.referralCommission || 0; // Default to 0 if not set
        const referralAmount = (transaction.amount * referralCommission) / 100;

        // Update transaction with referral amount
        transactionData.referralAmount = referralAmount;

        // Credit astrologer's wallet lockballance
        astrologer.wallet.lockedBalance += referralAmount;
        await astrologer.save({ validateBeforeSave: false });
        console.log(`Credited ${referralAmount} to astrologer ${astrologer._id} wallet`);
      }
    }
  }

  try {
    const updatedTransaction = await ProductTransaction.findByIdAndUpdate(
      req.params.id,
      transactionData,
      { new: true, runValidators: true }
    )
      .populate("user", "name email")
      .populate("shipping", "name address city state pincode")
      .populate("product", "name sellPrice");

    res.status(200).json({
      status: true,
      message: "Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    return next(new AppError(`Failed to update transaction: ${error.message}`, 500));
  }
});