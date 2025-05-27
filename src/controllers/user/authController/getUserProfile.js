const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");

exports.getUserProfile = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const result = await User.findById(userId);

  if (!result) {
    return res.status(400).json({
      success: false,
      message: "user profile not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "user profile fetched successfully",
    data: result,
  });
});
