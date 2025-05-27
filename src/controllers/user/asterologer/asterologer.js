const Astrologer = require("../../../models/asteroLogerSchema");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

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

  // Service filters (isChat, isCall, isVideo)
  if (isChat !== undefined) {
    query["services.chat"] = isChat === "true";
  }
  if (isCall !== undefined) {
    query["services.voice"] = isCall === "true";
  }
  if (isVideo !== undefined) {
    query["services.video"] = isVideo === "true";
  }

  const astrologers = await Astrologer.find(query)
    .populate("speciality")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: true,
    message: "Astrologers fetched successfully",
    data: astrologers,
  });
});

exports.getAstrologer = catchAsync(async (req, res, next) => {
  const astrologer = await Astrologer.findById(req.params.id).populate(
    "speciality"
  );

  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Astrologer fetched successfully",
    data: astrologer,
  });
});
