

const Role = require("../../../models/role");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Permission = require("../../../models/permission");

// Create Role
exports.createRole = catchAsync(async (req, res, next) => {
  const { name, permissions } = req.body;

  if (!name) {
    return next(new AppError("Role name is required", 400));
  }

  const existingRole = await Role.findOne({ name });
  if (existingRole) {
    return next(new AppError("Role already exists", 400));
  }

  let permissionIds = [];
  if (permissions && Array.isArray(permissions) && permissions.length > 0) {
    const permissionDocs = await Permission.insertMany(permissions);
    permissionIds = permissionDocs.map((doc) => doc._id);
  }

  const newRole = await Role.create({
    name,
    permission: permissionIds,
  });

  res.status(201).json({
    status: true,
    message: "Role created successfully",
    data: {
      role: newRole,
    },
  });
});

// Get All Roles


// Get Role by ID


// Update Role


