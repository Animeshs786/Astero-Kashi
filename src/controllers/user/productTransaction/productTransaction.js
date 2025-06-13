/* eslint-disable no-else-return */
const ProductTransaction = require("../../../models/productTransaction");
const User = require("../../../models/user");
const Shipping = require("../../../models/shipping");
const Product = require("../../../models/product");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");
const Razorpay = require("razorpay");
const crypto = require("crypto");

exports.createProductTransaction = catchAsync(async (req, res, next) => {
  const { shipping, product, quantity, PaymentMethod, gstAmount,referralCode } = req.body;
  const userId = req.user._id;

  const razorpay = new Razorpay({
    key_id: process.env.RAZOR_KEY_ID_TEST,
    key_secret: process.env.RAZOR_KEY_SECRET_TEST,
  });

  console.log(req.body, "body");

  // Validate required fields
  if (!shipping || !product || !PaymentMethod) {
    return next(
      new AppError("Shipping, product, and payment method are required", 400)
    );
  }

  // Validate quantity
  if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1)) {
    return next(new AppError("Quantity must be a positive integer", 400));
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

  // Validate shipping
  const shippingDoc = await Shipping.findById(shipping);
  if (!shippingDoc) {
    return next(new AppError("Shipping address not found", 404));
  }
  if (shippingDoc.user.toString() !== userId.toString()) {
    return next(
      new AppError("Unauthorized: Shipping address does not belong to you", 403)
    );
  }

  // Validate product
  const productDoc = await Product.findById(product);
  if (!productDoc) {
    return next(new AppError("Product not found", 404));
  }

  // Calculate amount
  const finalQuantity = quantity || 1;
  const amount = finalQuantity * productDoc.sellPrice;

  const transactionData = {
    user: userId,
    shipping,
    product,
    quantity: finalQuantity,
    PaymentMethod,
    amount,
    gstAmount,
    deliverStatus: "pending",
    status: PaymentMethod === "cod" ? "pending" : "pending",
  };
  if(referralCode){
    transactionData.referralCode = referralCode
  }

  try {
    if (PaymentMethod === "online") {
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: Math.round((amount + gstAmount) * 100), // Convert to paise
        currency: "INR",
        receipt: `txn_${Date.now()}`,
      });

      console.log(order, "order");

      transactionData.orderId = order.id;
    }

    const newTransaction = await ProductTransaction.create(transactionData);

    res.status(201).json({
      status: true,
      message: "Transaction created successfully",
      data: {
        transaction: newTransaction,
      },
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllProductTransactions = catchAsync(async (req, res) => {
  const { page: currentPage, limit: currentLimit } = req.query;
  const userId = req.user._id;

  let query = { user: userId }; // Restrict to authenticated user's transactions

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
  const userId = req.user._id;
  const transaction = await ProductTransaction.findById(req.params.id)
    .populate("user", "name email")
    .populate("shipping")
    .populate("product");

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  // Ensure the transaction belongs to the authenticated user
  if (transaction.user.toString() !== userId.toString()) {
    return next(
      new AppError("Unauthorized: You can only view your own transaction", 403)
    );
  }

  res.status(200).json({
    status: true,
    message: "Transaction fetched successfully",
    data: transaction,
  });
});

exports.updateProductTransaction = catchAsync(async (req, res, next) => {
  const { deliverStatus } = req.body;
  const userId = req.user._id;

  console.log(req.body, "body");
  const transaction = await ProductTransaction.findById(req.params.id);

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  // Ensure the transaction belongs to the authenticated user
  if (transaction.user.toString() !== userId.toString()) {
    return next(
      new AppError(
        "Unauthorized: You can only update your own transaction",
        403
      )
    );
  }

  const transactionData = {};

  // Allow users to update deliverStatus only to "cancelled"
  if (deliverStatus) {
    if (deliverStatus !== "cancelled") {
      return next(new AppError("Users can only cancel transactions", 400));
    }
    if (
      transaction.deliverStatus === "delivered" ||
      transaction.deliverStatus === "cancelled"
    ) {
      return next(
        new AppError("Cannot cancel a delivered or cancelled transaction", 400)
      );
    }
    transactionData.deliverStatus = deliverStatus;
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
    return next(error);
  }
});

exports.deleteProductTransaction = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const transaction = await ProductTransaction.findById(req.params.id);

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  // Ensure the transaction belongs to the authenticated user
  if (transaction.user.toString() !== userId.toString()) {
    return next(
      new AppError(
        "Unauthorized: You can only delete your own transaction",
        403
      )
    );
  }

  await ProductTransaction.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Transaction deleted successfully",
    data: null,
  });
});

exports.transactionWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  console.log("product transaction webhook");
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
      const transaction = await ProductTransaction.findOneAndUpdate(
        { orderId },
        {
          status: event.event === "payment.captured" ? "success" : "failed",
          transactionId: paymentEntity.id,
          deliverStatus:
            event.event === "payment.captured" ? "dispatched" : "pending",
        },
        { new: true }
      );

      if (!transaction) {
        console.error("Transaction not found for orderId:", orderId);
        return res
          .status(404)
          .json({ status: "error", message: "Transaction not found" });
      }

      return res.status(200).json({ status: "ok" });
    } else {
      return res.status(400).json({ status: "invalid signature" });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
