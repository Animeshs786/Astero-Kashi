const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");

exports.getProfile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  res.status(200).json({
    status: true,
    message: "Profile fetched successfully",
    data: {
      user,
    },
  });
});
