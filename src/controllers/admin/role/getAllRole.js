const Role = require("../../../models/role");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

exports.getAllRoles = catchAsync(async (req, res, next) => {
  // Extract query parameters
  const { page = 1, limit = 10, search = "" } = req.query;

  // Convert page and limit to integers
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  // Validate pagination parameters
  if (pageNum < 1 || limitNum < 1) {
    return next(new AppError("Page and limit must be positive integers", 400));
  }

  // Build the query
  const query = {};
  if (search) {
    query.name = { $regex: search, $options: "i" }; // Case-insensitive search on name
  }

  // Calculate skip value for pagination
  const skip = (pageNum - 1) * limitNum;

  // Fetch roles with pagination and search, populate permissions
  const roles = await Role.find(query)
    .populate("permission")
    .skip(skip)
    .limit(limitNum);

  // Get total count for pagination metadata
  const totalRoles = await Role.countDocuments(query);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalRoles / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({
    status: true,
    message: "Roles retrieved successfully",
    totalRoles,
    totalPages,
    currentPage: pageNum,
    limit: limitNum,
    hasNextPage,
    hasPrevPage,
    data: {
      roles,
    },
  });
});
