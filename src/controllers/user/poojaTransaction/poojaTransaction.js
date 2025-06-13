/* eslint-disable no-else-return */
const PoojaTransaction = require("../../../models/poojaTransaction"); // Adjust path to your PoojaTransaction model
const User = require("../../../models/user"); // Adjust path to your User model
const Pooja = require("../../../models/pooja"); // Adjust path to your Pooja model
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");
const Razorpay = require("razorpay");
const crypto = require("crypto");

exports.createPoojaTransaction = catchAsync(async (req, res, next) => {
  const { pooja, PaymentMethod, amount, gstAmount,astrologer } = req.body;
  const userId = req.user._id;

  const razorpay = new Razorpay({
    key_id: process.env.RAZOR_KEY_ID_TEST,
    key_secret: process.env.RAZOR_KEY_SECRET_TEST,
  });

  console.log(req.body, "body");

  // Validate required fields
  if (!pooja || !PaymentMethod) {
    return next(new AppError("Pooja and payment method are required", 400));
  }

  // Validate PaymentMethod
  if (!["online", "cod"].includes(PaymentMethod)) {
    return next(new AppError("Payment method must be 'online' or 'cod'", 400));
  }

  // Validate user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Validate pooja
  const poojaDoc = await Pooja.findById(pooja);
  if (!poojaDoc) {
    return next(new AppError("Pooja not found", 404));
  }

  const transactionData = {
    user: userId,
    pooja,
    PaymentMethod,
    gstAmount,
    amount,
    astrologer,
    status: PaymentMethod === "cod" ? "pending" : "pending",
  };

  try {
    if (PaymentMethod === "online") {
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: Math.round((amount+gstAmount) * 100), // Convert to paise
        currency: "INR",
        receipt: `pooja_txn_${Date.now()}`,
      });

      console.log(order, "order");

      transactionData.orderId = order.id;
    }

    const newTransaction = await PoojaTransaction.create(transactionData);

    res.status(201).json({
      status: true,
      message: "Pooja transaction created successfully",
      data: {
        transaction: newTransaction,
        razorpayOrder:
          PaymentMethod === "online"
            ? {
                orderId: newTransaction.orderId,
                amount: amount * 100, // In paise
                key: process.env.RAZOR_KEY_ID_TEST,
                currency: "INR",
              }
            : null,
      },
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllPoojaTransactions = catchAsync(async (req, res) => {
  const { page: currentPage, limit: currentLimit } = req.query;
  const userId = req.user._id;

  let query = { user: userId }; // Restrict to authenticated user's transactions

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
  const userId = req.user._id;
  const transaction = await PoojaTransaction.findById(req.params.id)
    .populate("user", "name email")
    .populate("pooja", "name sellPrice");

  if (!transaction) {
    return next(new AppError("Pooja transaction not found", 404));
  }

  // Ensure the transaction belongs to the authenticated user
  if (transaction.user.toString() !== userId.toString()) {
    return next(
      new AppError(
        "Unauthorized: You can only view your own pooja transaction",
        403
      )
    );
  }

  res.status(200).json({
    status: true,
    message: "Pooja transaction fetched successfully",
    data: transaction,
  });
});

exports.updatePoojaTransaction = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const transaction = await PoojaTransaction.findById(req.params.id);

  if (!transaction) {
    return next(new AppError("Pooja transaction not found", 404));
  }

  // Ensure the transaction belongs to the authenticated user
  if (transaction.user.toString() !== userId.toString()) {
    return next(
      new AppError(
        "Unauthorized: You can only update your own pooja transaction",
        403
      )
    );
  }

  // Prevent users from updating transactions (only admin can update status via webhook or manual process)
  return next(new AppError("Users cannot update pooja transactions", 403));
});

exports.deletePoojaTransaction = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const transaction = await PoojaTransaction.findById(req.params.id);

  if (!transaction) {
    return next(new AppError("Pooja transaction not found", 404));
  }

  // Ensure the transaction belongs to the authenticated user
  if (transaction.user.toString() !== userId.toString()) {
    return next(
      new AppError(
        "Unauthorized: You can only delete your own pooja transaction",
        403
      )
    );
  }

  await PoojaTransaction.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Pooja transaction deleted successfully",
    data: null,
  });
});

exports.poojaTransactionWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  console.log("pooja transaction webhook");
  try {
    // Verify webhook signature
    const bodyString = JSON.stringify(req.body);
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(bodyString);
    const digest = shasum.digest("hex");

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

      // Update transaction based on webhook event
      const transaction = await PoojaTransaction.findOneAndUpdate(
        { orderId },
        {
          status: event.event === "payment.captured" ? "success" : "failed",
          transactionId: paymentEntity.id,
        },
        { new: true }
      );

      if (!transaction) {
        console.error("Pooja transaction not found for orderId:", orderId);
        return res
          .status(404)
          .json({ status: "error", message: "Pooja transaction not found" });
      }

      return res.status(200).json({ status: "ok" });
    } else {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Error processing webhook:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
