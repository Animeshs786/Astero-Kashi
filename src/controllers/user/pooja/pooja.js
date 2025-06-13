const Pooja = require("../../../models/pooja");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllPoojas = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = { status: true };

  // Search by name (case-insensitive)
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Pooja,
    null,
    query
  );

  const poojas = await Pooja.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Poojas fetched successfully",
    data: poojas,
  });
});

exports.getPooja = catchAsync(async (req, res, next) => {
  const pooja = await Pooja.findById(req.params.id);

  if (!pooja) {
    return next(new AppError("Pooja not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Pooja fetched successfully",
    data: pooja,
  });
});
