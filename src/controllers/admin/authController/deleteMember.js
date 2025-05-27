const Admin = require("../../../models/admin");
const catchAsync = require("../../../utils/catchAsync");

exports.deleteMember = catchAsync(async (req, res) => {
  const userId = req.params.id;
  await Admin.findByIdAndDelete(userId);
  res.status(200).json({
    status: true,
    message: "Member deleted successfully",
  });
});
