const catchAsync = require("../../../utils/catchAsync");

exports.logout = catchAsync(async (req, res) => {
  res.cookie("xcvbexamstons", "", {
    expires: new Date(0),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
    message: "User Logout successfully.",
  });
});
