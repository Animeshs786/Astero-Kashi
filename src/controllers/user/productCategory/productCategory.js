const Category = require("../../../models/category");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllCategories = catchAsync(async (req, res) => {
  const { search } = req.query;

  let query = { status: true };

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const categories = await Category.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    status: true,
    message: "Categories fetched successfully",
    data: categories,
  });
});
