const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Transaction = require("../../../models/transaction");
const Settlement = require("../../../models/settlement");
const Astrologer = require("../../../models/asteroLogerSchema");
const moment = require("moment-timezone");
const deleteOldFiles = require("../../../utils/deleteOldFiles");

moment.tz.setDefault("Asia/Kolkata");

exports.createSettlement = catchAsync(async (req, res, next) => {
  const { astrologerId, startDate, endDate } = req.body;

  // Validate input
  if (!astrologerId || !startDate || !endDate) {
    return next(
      new AppError("Astrologer ID, start date, and end date are required", 400)
    );
  }

  // Validate astrologer
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  // Parse and validate dates
  const start = moment(startDate, "YYYY-MM-DD")
    .tz("Asia/Kolkata")
    .startOf("day");
  const end = moment(endDate, "YYYY-MM-DD").tz("Asia/Kolkata").endOf("day");

  if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
    return next(new AppError("Invalid date range", 400));
  }

  // Fetch unsettled transactions for the astrologer
  const transactions = await Transaction.find({
    astrologer: astrologerId,
    isSettled: false,
    type: "chat",
    status: "success",
    createdAt: { $gte: start.toDate(), $lte: end.toDate() },
  });

  if (!transactions.length) {
    return res.status(200).json({
      status: true,
      message: "No unsettled transactions found for the specified period",
      data: [],
    });
  }

  // Calculate amounts
  let totalAmount = 0;
  transactions.forEach((txn) => {
    totalAmount += txn.amount;
  });

  const commissionRate = astrologer.commission / 100; // e.g., 2% = 0.02
  const totalCommission = totalAmount * commissionRate; // Commission amount
  const netAmountAfterCommission = totalAmount - totalCommission; // Amount after commission
  const gstRate = 0.18; // 18% GST
  const gstCharge = netAmountAfterCommission * gstRate; // GST on net amount
  const totalSettlementAmount = netAmountAfterCommission - gstCharge; // Final settlement amount

  // Check if sufficient lockedBalance
  if (astrologer.wallet.lockedBalance < totalAmount) {
    return next(
      new AppError(
        "Insufficient locked balance for settlement",
        400
      )
    );
  }

  // Deduct totalAmount from astrologer's lockedBalance
  astrologer.wallet.lockedBalance -= totalAmount;
  await astrologer.save({ validateBeforeSave: false });

  // Create description
  const description =
    totalSettlementAmount >= 0
      ? `Settlement for astrologer ${astrologer.name} for transactions from ${startDate} to ${endDate}`
      : `Negative settlement for astrologer ${astrologer.name} for transactions from ${startDate} to ${endDate}`;

  // Create settlement record
  const settlement = new Settlement({
    astrologer: astrologerId,
    startDate: start.toDate(),
    endDate: end.toDate(),
    transactions: transactions.map((txn) => txn._id),
    totalAmount,
    totalCommission,
    gstCharge,
    totalSettlementAmount,
    status: "pending",
    description,
  });

  await settlement.save();

  // Mark transactions as settled
  await Transaction.updateMany(
    { _id: { $in: settlement.transactions } },
    { isSettled: true, settledDate: new Date() }
  );

  res.status(201).json({
    status: true,
    message: "Settlement record created successfully",
    data: settlement,
  });
});

exports.completeSettlement = catchAsync(async (req, res, next) => {
  const { id: settlementId } = req.params;
  const { remark } = req.body;
  let receiptImagePath;

  // Validate settlementId
  if (!settlementId) {
    return next(new AppError("Settlement ID is required", 400));
  }

  // Fetch settlement
  const settlement = await Settlement.findById(settlementId).populate(
    "astrologer"
  );
  if (!settlement) {
    return next(new AppError("Settlement not found", 404));
  }

  if (settlement.status === "completed") {
    return next(new AppError("Settlement already completed", 400));
  }

  try {
    // Handle receiptImage upload
    if (req.files && req.files.receiptImage) {
      const url = `${req.files.receiptImage[0].destination}/${req.files.receiptImage[0].filename}`;
      settlement.receiptImage = url;
      receiptImagePath = url;
    }

    // Update remark if provided
    if (remark) {
      settlement.remark = remark;
    }

    // Update astrologer wallet: add totalSettlementAmount to balance
    const astrologer = await Astrologer.findById(settlement.astrologer);
    astrologer.wallet.balance += settlement.totalSettlementAmount;
    await astrologer.save({ validateBeforeSave: false });

    // Update settlement status
    settlement.status = "completed";
    settlement.settledAt = new Date();
    await settlement.save();

    res.status(200).json({
      status: true,
      message: "Settlement completed successfully",
      data: settlement,
    });
  } catch (error) {
    // Clean up uploaded file if operation fails
    if (receiptImagePath) {
      await deleteOldFiles(receiptImagePath).catch((err) => {
        console.error("Failed to delete receipt image:", err);
      });
    }
    return next(error);
  }
});

exports.getAllSettlements = catchAsync(async (req, res, next) => {
  const {
    astrologerId,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 10,
  } = req.query;

  // Build query
  const query = {};

  // Filter by astrologerId
  if (astrologerId) {
    query.astrologer = astrologerId;
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) {
      const start = moment(startDate, "YYYY-MM-DD")
        .tz("Asia/Kolkata")
        .startOf("day");
      if (!start.isValid()) {
        return next(new AppError("Invalid start date", 400));
      }
      query.startDate.$gte = start.toDate();
    }
    if (endDate) {
      const end = moment(endDate, "YYYY-MM-DD").tz("Asia/Kolkata").endOf("day");
      if (!end.isValid()) {
        return next(new AppError("Invalid end date", 400));
      }
      query.startDate.$lte = end.toDate();
    }
  }

  // Pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  if (pageNum < 1 || limitNum < 1) {
    return next(new AppError("Page and limit must be positive integers", 400));
  }
  const skip = (pageNum - 1) * limitNum;

  // Fetch settlements
  const settlements = await Settlement.find(query)
    .populate("astrologer", "name email")
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Total settlements for pagination
  const totalSettlements = await Settlement.countDocuments(query);

  res.status(200).json({
    status: true,
    message: "Settlements retrieved successfully",
    total: totalSettlements,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(totalSettlements / limitNum),
    data: {
      settlements,
    },
  });
});

exports.getSettlementDetail = catchAsync(async (req, res, next) => {
  const { id: settlementId } = req.params;

  if (!settlementId) {
    return next(new AppError("Settlement ID is required", 400));
  }

  const settlement = await Settlement.findById(settlementId)
    .populate("astrologer", "name email")
    .populate("transactions")
    .lean();

  if (!settlement) {
    return next(new AppError("Settlement not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Settlement details retrieved successfully",
    data: settlement,
  });
});