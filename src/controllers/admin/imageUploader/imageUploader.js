
const ImageUploader = require("../../../models/imageUpload");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");

// Create Image
exports.createImage = catchAsync(async (req, res, next) => {
  let imagePath;
  // Check if an image file is provided
  if (!req.files.image) {
    return next(new AppError("Image file is required", 400));
  }

  try {
     const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      imagePath = imageUrl;

    // Create new image document
    const newImage = await ImageUploader.create({
      image: imageUrl,
    });

    res.status(201).json({
      status: true,
      message: "Image uploaded successfully",
      data: newImage,
    });
  } catch (error) {
    // Clean up uploaded image if creation fails
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

// Get All Images
exports.getAllImages = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  // Simple pagination
  const skip = (page - 1) * limit;
  const totalResult = await ImageUploader.countDocuments();
  const totalPage = Math.ceil(totalResult / limit);

  const images = await ImageUploader.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Images fetched successfully",
    data: images,
  });
});

// Get Single Image
exports.getImage = catchAsync(async (req, res, next) => {
  const image = await ImageUploader.findById(req.params.id);

  if (!image) {
    return next(new AppError("Image not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Image fetched successfully",
    data: image,
  });
});

// Update Image
exports.updateImage = catchAsync(async (req, res, next) => {
  let newImagePath;
  const image = await ImageUploader.findById(req.params.id);

  if (!image) {
    return next(new AppError("Image not found", 404));
  }

  const imageData = {};

  try {
    // Handle new image upload
    if (req.files) {

       const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      newImagePath = imageUrl;


      // Delete old image if exists
      if (image.image) {
        await deleteOldFiles(image.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    // Update image document
    const updatedImage = await ImageUploader.findByIdAndUpdate(
      req.params.id,
      imageData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    // Clean up new image if update fails
    if (newImagePath) {
      await deleteOldFiles(newImagePath).catch((err) => {
        console.error("Failed to delete new image:", err);
      });
    }
    return next(error);
  }
});

// Delete Image
exports.deleteImage = catchAsync(async (req, res, next) => {
  const image = await ImageUploader.findById(req.params.id);

  if (!image) {
    return next(new AppError("Image not found", 404));
  }

  // Delete associated image file if exists
  if (image.image) {
    await deleteOldFiles(image.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await ImageUploader.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Image deleted successfully",
    data: null,
  });
});