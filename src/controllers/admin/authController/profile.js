const Admin = require("../../../models/admin");
const catchAsync = require("../../../utils/catchAsync");

exports.profile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const user = await Admin.findById(userId).populate({
    path: "role",
    select: "name",
    populate: {
      path: "permission",
      model: "Permission",
      select: "sectionName isCreate isRead isUpdate isDelete",
    },
  });
  res.status(200).json({
    status: true,
    message: "Profile fetched successfully",
    data: {
      user,
    },
  });
});
