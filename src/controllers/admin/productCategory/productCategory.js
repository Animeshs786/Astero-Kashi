const Category = require("../../../models/category"); // Adjust path to your Category model
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, status } = req.body;
  let imagePath;

  console.log(req.body, "body");

  // Validate required fields
  if (!name) {
    return next(new AppError("Name is required", 400));
  }

  // Check for duplicate category name
  const existingCategory = await Category.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });
  if (existingCategory) {
    return next(new AppError("Category name must be unique", 400));
  }

  const categoryData = {
    name,
    description: description || "",
    status: status !== undefined ? status : true,
  };

  try {
    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      categoryData.image = imageUrl;
      imagePath = imageUrl;
    }

    const newCategory = await Category.create(categoryData);

    res.status(201).json({
      status: true,
      message: "Category created successfully",
      data: newCategory,
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

exports.getAllCategories = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Category,
    null,
    query
  );

  const categories = await Category.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Categories fetched successfully",
    data: categories,
  });
});

exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Category fetched successfully",
    data: category,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name, description, status } = req.body;
  let imagePath;

  console.log(req.body, "body");
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // Check for duplicate category name (excluding current category)
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });
    if (existingCategory) {
      return next(new AppError("Category name must be unique", 400));
    }
  }

  const categoryData = {};

  if (name) categoryData.name = name;
  if (description !== undefined) categoryData.description = description;
  if (status !== undefined) categoryData.status = status;

  try {
    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      categoryData.image = imageUrl;
      imagePath = imageUrl;

      // Delete old image if exists
      if (category.image) {
        await deleteOldFiles(category.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      categoryData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    // Clean up uploaded image if update fails
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // Delete associated image if exists
  if (category.image) {
    await deleteOldFiles(category.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await Category.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Category deleted successfully",
    data: null,
  });
});