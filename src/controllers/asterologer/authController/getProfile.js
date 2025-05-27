const Astrologer = require("../../../models/asteroLogerSchema");
const catchAsync = require("../../../utils/catchAsync");

exports.getProfile = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;
  const astrologer = await Astrologer.findById(astrologerId);
  res.status(200).json({
    status: true,
    message: "Profile fetched successfully",
    data: {
      astrologer,
    },
  });
});