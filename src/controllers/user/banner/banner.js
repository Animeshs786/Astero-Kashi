const Banner = require("../../../models/banner");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllBanners = catchAsync(async (req, res) => {
  const { search } = req.query;

  let query = {
    platform: { $in: ["web", "both"] },
    status: true,
  };

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  const banners = await Banner.find(query).sort("priority");

  res.status(200).json({
    status: true,
    message: "Banners fetched successfully",
    data: banners,
  });
});

exports.getBanner = catchAsync(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new AppError("Banner not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Banner fetched successfully",
    data: banner,
  });
});
