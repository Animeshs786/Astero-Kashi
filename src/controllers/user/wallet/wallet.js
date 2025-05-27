const RechargePlan = require("../../../models/rechargePlan");
const Transaction = require("../../../models/transaction");
const User = require("../../../models/user");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { generateTransactionInvoice } = require("../../invoice/invoice");

exports.rechargeWallet = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  const userId = req.user._id;
  // Validate required fields
  if (!userId || !amount) {
    return next(new AppError("User ID and amount are required", 400));
  }

  // Validate amount is a positive number
  if (amount <= 0) {
    return next(new AppError("Amount must be a positive number", 400));
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  let finalAmount = amount;
  let description = `Wallet recharge of ${amount}`;

  // Check if amount matches any recharge plan
  const rechargePlan = await RechargePlan.findOne({ rechargeAmount: amount });
  console.log(rechargePlan, "oaffer");
  if (rechargePlan) {
    if (rechargePlan.offerType === "fixed") {
      finalAmount = amount + rechargePlan.offerValue;
      description = `Wallet recharge of ${amount} with fixed offer of ${rechargePlan.offerValue}`;
    } else if (rechargePlan.offerType === "percentage") {
      const offerAmount = (amount * rechargePlan.offerValue) / 100;
      finalAmount = amount + offerAmount;
      description = `Wallet recharge of ${amount} with ${rechargePlan.offerValue}% offer`;
    }
  }

  // Create transaction record
  const transaction = await Transaction.create({
    amount: amount,
    user: userId,
    description,
    status: "success",
    type: "walletRecharge",
  });

  // Update user's wallet balance
  user.wallet.balance += finalAmount;
  await user.save({ validateBeforeSave: false });
  await generateTransactionInvoice(transaction._id);

  res.status(200).json({
    status: true,
    message: "Wallet recharged successfully",
    data: {
      user: {
        _id: user._id,
        wallet: user.wallet,
      },
      transaction,
    },
  });
});

exports.getWalletBalance = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  // Validate userId
  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }

  // Check if user exists
  const user = await User.findById(userId).select("wallet");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Wallet balance fetched successfully",
    data: {
      wallet: {
        balance: user.wallet.balance,
        lockedBalance: user.wallet.lockedBalance,
      },
    },
  });
});
