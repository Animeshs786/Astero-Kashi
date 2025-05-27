const Speciality = require("../../../models/speciality");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createSpeciality = catchAsync(async (req, res, next) => {
  const { name, status } = req.body;

  if (!name) {
    return next(new AppError("Speciality name is required", 400));
  }

  // Check if speciality name already exists
  const existingSpeciality = await Speciality.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });
  if (existingSpeciality) {
    return next(new AppError("Speciality name must be unique", 400));
  }

  const specialityData = { name, status };

  try {
    const newSpeciality = await Speciality.create(specialityData);

    res.status(201).json({
      status: true,
      message: "Speciality created successfully",
      data: newSpeciality,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllSpecialities = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Speciality,
    null,
    query
  );

  const specialities = await Speciality.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Specialities fetched successfully",
    data: specialities,
  });
});

exports.getSpeciality = catchAsync(async (req, res, next) => {
  const speciality = await Speciality.findById(req.params.id);

  if (!speciality) {
    return next(new AppError("Speciality not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Speciality fetched successfully",
    data: speciality,
  });
});

exports.updateSpeciality = catchAsync(async (req, res, next) => {
  const { name, status } = req.body;
  const speciality = await Speciality.findById(req.params.id);

  if (!speciality) {
    return next(new AppError("Speciality not found", 404));
  }

  if (name) {
    // Check if new name is unique (excluding current speciality)
    const existingSpeciality = await Speciality.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });
    if (existingSpeciality) {
      return next(new AppError("Speciality name must be unique", 400));
    }
  }

  const specialityData = {};

  if (name) specialityData.name = name;
  if (status !== "") specialityData.status = status;

  try {
    const updatedSpeciality = await Speciality.findByIdAndUpdate(
      req.params.id,
      specialityData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Speciality updated successfully",
      data: updatedSpeciality,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deleteSpeciality = catchAsync(async (req, res, next) => {
  const speciality = await Speciality.findById(req.params.id);

  if (!speciality) {
    return next(new AppError("Speciality not found", 404));
  }

  await Speciality.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Speciality deleted successfully",
    data: null,
  });
});
