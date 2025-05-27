const Role = require("../../../models/role");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

// exports.getRoleById = catchAsync(async (req, res, next) => {
//   const { id } = req.params;
//   const role = await Role.findById(id).populate({
//     path: "permission",
//     select: "-createdAt -__v -_id",
//   });

//   if (!role) {
//     return next(new AppError("Role not found", 404));
//   }

//   res.status(200).json({
//     status: true,
//     data: role,
//   });
// });


exports.getRoleById = catchAsync(async (req, res, next) => {
  const role = await Role.findById(req.params.id).populate("permission");

  if (!role) {
    return next(new AppError("Role not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Role retrieved successfully",
    data: {
      role,
    },
  });
});