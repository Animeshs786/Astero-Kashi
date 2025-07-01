const Astrologer = require("../../../models/asteroLogerSchema");
const Transaction = require("../../../models/transaction");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

// exports.getAllAstrologers = catchAsync(async (req, res) => {
//   const { search, status, isChat, isCall, isVideo, speciality } = req.query;

//   let query = { isVerify: true };

//   // Search filter
//   if (search) {
//     query.$or = [
//       { name: { $regex: search, $options: "i" } },
//       { email: { $regex: search, $options: "i" } },
//       { mobile: { $regex: search, $options: "i" } },
//     ];
//   }

//   if (speciality) query.speciality = { $in: [speciality] };

//   // Status filter
//   if (status) {
//     query.status = status;
//   }

//   // Service filters
//   if (isChat !== undefined) {
//     query["services.chat"] = isChat === "true";
//   }
//   if (isCall !== undefined) {
//     query["services.voice"] = isCall === "true";
//   }
//   if (isVideo !== undefined) {
//     query["services.video"] = isVideo === "true";
//   }

//   const astrologers = await Astrologer.find(query)
//     .populate("speciality")
//     .sort([
//       ["status", -1], // Sort by status (online before offline)
//       ["isBusy", 1],  // Within online, non-busy (false) before busy (true)
//       ["createdAt", -1] // Finally sort by createdAt
//     ]);

//   res.status(200).json({
//     status: true,
//     message: "Astrologers fetched successfully",
//     data: astrologers,
//   });
// });

exports.getAllAstrologers = catchAsync(async (req, res) => {
  const { search, status, isChat, isCall, isVideo, speciality } = req.query;

  let query = { isVerify: true };

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  if (speciality) query.speciality = { $in: [speciality] };

  // Status filter
  if (status) {
    query.status = status;
  }

  // Service filters
  if (isChat !== undefined) {
    query["services.chat"] = isChat === "true";
  }
  if (isCall !== undefined) {
    query["services.voice"] = isCall === "true";
  }
  if (isVideo !== undefined) {
    query["services.video"] = isVideo === "true";
  }

  // Fetch astrologers
  const astrologers = await Astrologer.find(query)
    .populate("speciality")
    .sort([
      ["status", -1], // Sort by status (online before offline)
      ["isBusy", 1], // Within online, non-busy (false) before busy (true)
      ["createdAt", -1], // Finally sort by createdAt
    ])
    .lean(); // Convert to plain JavaScript objects for easier manipulation

  // Aggregate durations from Transaction schema
  const astrologerIds = astrologers.map((astrologer) => astrologer._id);
  const durationAggregation = await Transaction.aggregate([
    {
      $match: {
        astrologer: { $in: astrologerIds },
        status: "success", // Only consider successful transactions
        type: { $in: ["chat", "voice", "video"] }, // Relevant transaction types
      },
    },
    {
      $group: {
        _id: "$astrologer",
        chatDuration: {
          $sum: {
            $cond: [
              { $eq: ["$type", "chat"] },
              { $convert: { input: "$duration", to: "double", onError: 0 } },
              0,
            ],
          },
        },
        callDuration: {
          $sum: {
            $cond: [
              { $eq: ["$type", "voice"] },
              { $convert: { input: "$duration", to: "double", onError: 0 } },
              0,
            ],
          },
        },
        videoCallDuration: {
          $sum: {
            $cond: [
              { $eq: ["$type", "video"] },
              { $convert: { input: "$duration", to: "double", onError: 0 } },
              0,
            ],
          },
        },
      },
    },
  ]);

  // Map durations to astrologers
  const durationMap = durationAggregation.reduce((acc, curr) => {
    acc[curr._id] = {
      chatDuration: curr.chatDuration || 0,
      callDuration: curr.callDuration || 0,
      videoCallDuration: curr.videoCallDuration || 0,
    };
    return acc;
  }, {});

  // Add durations to astrologer objects
  const astrologersWithDurations = astrologers.map((astrologer) => ({
    ...astrologer,
    chatDuration: (durationMap[astrologer._id]?.chatDuration || 0).toFixed(2),
    callDuration: (durationMap[astrologer._id]?.callDuration || 0).toFixed(2),
    videoCallDuration: (
      durationMap[astrologer._id]?.videoCallDuration || 0
    ).toFixed(2),
  }));

  res.status(200).json({
    status: true,
    message: "Astrologers fetched successfully",
    data: astrologersWithDurations,
  });
});

// exports.getAstrologer = catchAsync(async (req, res, next) => {
//   const astrologer = await Astrologer.findById(req.params.id).populate(
//     "speciality"
//   );

//   if (!astrologer) {
//     return next(new AppError("Astrologer not found", 404));
//   }

//   res.status(200).json({
//     status: true,
//     message: "Astrologer fetched successfully",
//     data: astrologer,
//   });
// });

exports.getAstrologer = catchAsync(async (req, res, next) => {
  const astrologer = await Astrologer.findById(req.params.id)
    .populate("speciality")
    .lean(); // Convert to plain JavaScript object for easier manipulation

  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  // Aggregate durations from Transaction schema
  const durationAggregation = await Transaction.aggregate([
    {
      $match: {
        astrologer: astrologer._id,
        status: "success", // Only consider successful transactions
        type: { $in: ["chat", "voice", "video"] }, // Relevant transaction types
      },
    },
    {
      $group: {
        _id: null,
        chatDuration: {
          $sum: {
            $cond: [
              { $eq: ["$type", "chat"] },
              { $convert: { input: "$duration", to: "double", onError: 0 } },
              0,
            ],
          },
        },
        callDuration: {
          $sum: {
            $cond: [
              { $eq: ["$type", "voice"] },
              { $convert: { input: "$duration", to: "double", onError: 0 } },
              0,
            ],
          },
        },
        videoCallDuration: {
          $sum: {
            $cond: [
              { $eq: ["$type", "video"] },
              { $convert: { input: "$duration", to: "double", onError: 0 } },
              0,
            ],
          },
        },
      },
    },
  ]);

  // Extract durations from aggregation result
  const durations = durationAggregation[0] || {
    chatDuration: 0,
    callDuration: 0,
    videoCallDuration: 0,
  };

  // Add durations to astrologer object
  const astrologerWithDurations = {
    ...astrologer,
    chatDuration: durations.chatDuration.toFixed(2),
    callDuration: durations.callDuration.toFixed(2),
    videoCallDuration: durations.videoCallDuration.toFixed(2),
  };

  res.status(200).json({
    status: true,
    message: "Astrologer fetched successfully",
    data: astrologerWithDurations,
  });
});
