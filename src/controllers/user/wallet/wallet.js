/* eslint-disable no-else-return */
const RechargePlan = require("../../../models/rechargePlan");
const Transaction = require("../../../models/transaction");
const User = require("../../../models/user");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { generateTransactionInvoice } = require("../../invoice/invoice");
const Razorpay = require("razorpay");
const crypto = require("crypto");

exports.rechargeWallet = catchAsync(async (req, res, next) => {
  const { amount, gstAmount } = req.body;
  const userId = req.user._id;
  const gstIncludeAmount = amount + gstAmount;

  const razorpay = new Razorpay({
    key_id: process.env.RAZOR_KEY_ID_TEST,
    key_secret: process.env.RAZOR_KEY_SECRET_TEST,
  });

  console.log(req.body, "body");

  // Validate required fields
  if (!amount) {
    return next(new AppError("Amount is required", 400));
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
  console.log(rechargePlan, "offer");
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
 console.log(gstIncludeAmount,"ds")
  try {
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(gstIncludeAmount * 100), // Convert to paise
      currency: "INR",
      receipt: `txn_wallet_${Date.now()}`,
    });

    console.log(order, "order");

    // Create transaction record
    const transaction = await Transaction.create({
      amount:gstIncludeAmount,
      user: userId,
      description,
      status: "pending",
      type: "walletRecharge",
      orderId: order.id,
    });

    res.status(201).json({
      status: true,
      message: "Wallet recharge order created successfully",
      data: {
        transaction,
        razorpayOrder: {
          orderId: order.id,
          amount: gstIncludeAmount * 100, // In paise
          key: process.env.RAZOR_KEY_ID_TEST,
          currency: "INR",
        },
      },
    });
  } catch (error) {
    return next(
      new AppError(`Failed to create Razorpay order: ${error.message}`, 500)
    );
  }
});

exports.walletWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  console.log("transaction webhook");
  try {
    // Verify webhook signature
    const bodyString = JSON.stringify(req.body);
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(bodyString);
    const digest = shasum.digest("hex");
    console.log(digest, "digest++++++++++");

    if (digest === req.headers["x-razorpay-signature"]) {
      const event = req.body;
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      console.log(event.event, "event.event");

      if (!orderId) {
        console.error("Order ID is null. Cannot proceed.");
        return res
          .status(400)
          .json({ status: "error", message: "Order ID is null" });
      }

      // Find transaction
      const transaction = await Transaction.findOne({ orderId }).populate(
        "user"
      );
      if (!transaction) {
        console.error("Transaction not found for orderId:", orderId);
        return res
          .status(404)
          .json({ status: "error", message: "Transaction not found" });
      }

      // Handle payment events
      if (event.event === "payment.captured") {
        // Calculate final amount with recharge plan offer
        let finalAmount = transaction.amount;
        const rechargePlan = await RechargePlan.findOne({
          rechargeAmount: transaction.amount,
        });
        if (rechargePlan) {
          if (rechargePlan.offerType === "fixed") {
            finalAmount += rechargePlan.offerValue;
            transaction.description = `Wallet recharge of ${transaction.amount} with fixed offer of ${rechargePlan.offerValue}`;
          } else if (rechargePlan.offerType === "percentage") {
            const offerAmount =
              (transaction.amount * rechargePlan.offerValue) / 100;
            finalAmount += offerAmount;
            transaction.description = `Wallet recharge of ${transaction.amount} with ${rechargePlan.offerValue}% offer of ${transaction.amount}`;
          }
        }

        // Update transaction
        transaction.status = "success";
        transaction.transactionId = paymentEntity.id;
        await transaction.save();

        // Update user wallet balance
        if (!transaction.user) {
          console.error("User not found for transaction:", transaction._id);
          return res
            .status(400)
            .json({ status: "error", message: "User not found" });
        }

        transaction.user.wallet.balance += finalAmount;
        await transaction.user.save({ validateBeforeSave: false });

        // Generate invoice
        await generateTransactionInvoice(transaction._id);
      } else if (event.event === "payment.failed") {
        // Update transaction status
        transaction.status = "failed";
        transaction.transactionId = paymentEntity.id;
        await transaction.save();
      } else {
        console.warn("Unhandled event:", event.event);
        return res.status(200).json({ status: "ok" });
      }

      return res.status(200).json({ status: "ok" });
    } else {
      console.error("Invalid signature");
      return res
        .status(400)
        .json({ status: "error", message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Error processing webhook:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

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
