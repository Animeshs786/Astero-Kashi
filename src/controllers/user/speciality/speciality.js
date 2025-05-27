const Speciality = require("../../../models/speciality");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllSpecialities = catchAsync(async (req, res) => {
  const { search } = req.query;

  let query = {status:true};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const specialities = await Speciality.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    status: true,
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
