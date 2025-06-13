const Product = require("../../../models/product"); // Adjust path to your Product model
const Category = require("../../../models/category"); // Adjust path to your Category model
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createProduct = catchAsync(async (req, res, next) => {
  const { name, price, sellPrice, benefits, description, category } = req.body;
  let thumbImagePath, imagePaths = [];

  console.log(req.body, "body");

  // Validate required fields
  if (!name || price === undefined || sellPrice === undefined || !category) {
    return next(new AppError("Name, price, sell price, and category are required", 400));
  }

  // Validate price fields
  if (price < 0 || sellPrice < 0) {
    return next(new AppError("Price and sell price cannot be negative", 400));
  }

  // Validate category
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(new AppError("Category does not exist", 404));
  }

  const productData = {
    name,
    price: parseFloat(price),
    sellPrice: parseFloat(sellPrice),
    benefits: benefits || "",
    description: description || "",
    category,
  };

  try {
    // Handle thumbImage (single file)
    if (!req.files || !req.files.thumbImage || req.files.thumbImage.length !== 1) {
      return next(new AppError("Exactly one thumbnail image is required", 400));
    }
    const thumbImage = req.files.thumbImage[0];
    const thumbImageUrl = `${thumbImage.destination}/${thumbImage.filename}`;
    productData.thumbImage = thumbImageUrl;
    thumbImagePath = thumbImageUrl;

    // Handle multiple images (optional)
    if (req.files && req.files.image) {
      imagePaths = req.files.image.map((file) => `${file.destination}/${file.filename}`);
      productData.image = imagePaths;
    }

    const newProduct = await Product.create(productData);

    res.status(201).json({
      status: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    // Clean up uploaded images if creation fails
    if (thumbImagePath) {
      await deleteOldFiles(thumbImagePath).catch((err) => {
        console.error("Failed to delete thumbnail image:", err);
      });
    }
    if (imagePaths.length > 0) {
      for (const path of imagePaths) {
        await deleteOldFiles(path).catch((err) => {
          console.error("Failed to delete image:", err);
        });
      }
    }
    return next(error);
  }
});

exports.getAllProducts = catchAsync(async (req, res) => {
  const { searchName, categoryId, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  // Search by name (case-insensitive)
  if (searchName) {
    query.name = { $regex: searchName, $options: "i" };
  }

  // Filter by category
  if (categoryId) {
    query.category = categoryId;
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Product,
    null,
    query
  );

  const products = await Product.find(query)
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Products fetched successfully",
    data: products,
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("category", "name");

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Product fetched successfully",
    data: product,
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const { name, price, sellPrice, benefits, description, category } = req.body;
  let thumbImagePath, imagePaths = [];

  console.log(req.body, "body");
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Validate category if provided
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new AppError("Category not found", 404));
    }
  }

  // Validate price fields if provided
  if (price !== undefined && price < 0) {
    return next(new AppError("Price cannot be negative", 400));
  }
  if (sellPrice !== undefined && sellPrice < 0) {
    return next(new AppError("Sell price cannot be negative", 400));
  }

  const productData = {};

  if (name) productData.name = name;
  if (price !== undefined) productData.price = parseFloat(price);
  if (sellPrice !== undefined) productData.sellPrice = parseFloat(sellPrice);
  if (benefits !== undefined) productData.benefits = benefits;
  if (description !== undefined) productData.description = description;
  if (category) productData.category = category;

  try {
    // Handle thumbImage update
    if (req.files && req.files.thumbImage) {
      const thumbImage = req.files.thumbImage[0];
      const thumbImageUrl = `${thumbImage.destination}/${thumbImage.filename}`;
      productData.thumbImage = thumbImageUrl;
      thumbImagePath = thumbImageUrl;

      // Delete old thumbImage if exists
      if (product.thumbImage) {
        await deleteOldFiles(product.thumbImage).catch((err) => {
          console.error("Failed to delete old thumbnail image:", err);
        });
      }
    }

    // Handle multiple images update
    if (req.files && req.files.image) {
      imagePaths = req.files.image.map((file) => `${file.destination}/${file.filename}`);
      productData.image = imagePaths;

      // Delete old images if exist
      if (product.image && product.image.length > 0) {
        for (const oldImage of product.image) {
          await deleteOldFiles(oldImage).catch((err) => {
            console.error("Failed to delete old image:", err);
          });
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    ).populate("category", "name");

    res.status(200).json({
      status: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    // Clean up uploaded images if update fails
    if (thumbImagePath) {
      await deleteOldFiles(thumbImagePath).catch((err) => {
        console.error("Failed to delete thumbnail image:", err);
      });
    }
    if (imagePaths.length > 0) {
      for (const path of imagePaths) {
        await deleteOldFiles(path).catch((err) => {
          console.error("Failed to delete image:", err);
        });
      }
    }
    return next(error);
  }
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Delete associated images
  if (product.thumbImage) {
    await deleteOldFiles(product.thumbImage).catch((err) => {
      console.error("Failed to delete thumbnail image:", err);
    });
  }
  if (product.image && product.image.length > 0) {
    for (const image of product.image) {
      await deleteOldFiles(image).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Product deleted successfully",
    data: null,
  });
});