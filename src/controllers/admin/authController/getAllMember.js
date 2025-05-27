const Admin = require("../../../models/admin");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllMember = catchAsync(async (req, res) => {
  const { page: currentPage, limit: currentLimit } = req.query;
  const filterObj = {};
  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Admin,
    null,
    filterObj
  );
  const user = await Admin.find(filterObj)
    .sort("-createdAt")
    .populate("role")
    .limit(limit)
    .skip(skip);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    results: user.length,
    message: "admin fetched successfully",
    data: {
      user,
    },
  });
});
