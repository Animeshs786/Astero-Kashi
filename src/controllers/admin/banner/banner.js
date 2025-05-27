const Banner = require("../../../models/banner");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createBanner = catchAsync(async (req, res, next) => {
  const {
    title,
    priority = 1,
    platform = "both",
    redirect,
    redirectUrl,
    status = true,
  } = req.body;
  let imagePath;

  const bannerData = {
    title,
    priority,
    platform,
    redirect,
    redirectUrl,
    status,
  };

  try {
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      bannerData.image = imageUrl;
      imagePath = imageUrl;
    }

    const newBanner = await Banner.create(bannerData);

    res.status(201).json({
      status: true,
      message: "Banner created successfully",
      data: newBanner,
    });
  } catch (error) {
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.getAllBanners = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Banner,
    null,
    query
  );

  const banners = await Banner.find(query)
    .sort("priority")
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
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

exports.updateBanner = catchAsync(async (req, res, next) => {
  const { title, priority, platform, redirect, redirectUrl, status } = req.body;
  let imagePath;
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new AppError("Banner not found", 404));
  }

  const bannerData = {};

  if (title !== undefined) bannerData.title = title;
  if (priority) bannerData.priority = priority;
  if (platform) bannerData.platform = platform;
  if (redirect) bannerData.redirect = redirect;
  if (redirectUrl) bannerData.redirectUrl = redirectUrl;
  if (status !== undefined) bannerData.status = status;

  try {
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      bannerData.image = imageUrl;
      imagePath = imageUrl;

      // Delete old image if exists
      if (banner.image) {
        await deleteOldFiles(banner.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      bannerData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Banner updated successfully",
      data: updatedBanner,
    });
  } catch (error) {
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.deleteBanner = catchAsync(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new AppError("Banner not found", 404));
  }

  // Delete associated image if exists
  if (banner.image) {
    await deleteOldFiles(banner.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await Banner.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Banner deleted successfully",
    data: null,
  });
});
