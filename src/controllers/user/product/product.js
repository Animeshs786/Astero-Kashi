const Product = require("../../../models/product");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllProducts = catchAsync(async (req, res) => {
  const {
    searchName,
    categoryId,
    page: currentPage,
    limit: currentLimit,
  } = req.query;

  let query = { status: true };

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
  const product = await Product.findById(req.params.id).populate(
    "category",
    "name"
  );

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Product fetched successfully",
    data: product,
  });
});
