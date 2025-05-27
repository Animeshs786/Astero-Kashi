const Astrologer = require("../../../models/asteroLogerSchema");
const catchAsync = require("../../../utils/catchAsync");

exports.deleteAccount = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;
  console.log(astrologerId, "astrologerId");
  await Astrologer.findByIdAndDelete(astrologerId);

  res.status(200).json({
    status: true,
    message: "Account deleted successfully",
  });
});