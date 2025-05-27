const Role = require("../../../models/role");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Permission = require("../../../models/permission");

exports.updateRole = catchAsync(async (req, res, next) => {
  const { name, permissions, removeUnlistedPermissions = false } = req.body;
  const { id } = req.params;

  // Validate role existence
  const role = await Role.findById(id);
  if (!role) {
    return next(new AppError("Role not found", 404));
  }

  // Update name if provided
  if (name) {
    const existingRole = await Role.findOne({ name });
    if (existingRole && existingRole._id.toString() !== role._id.toString()) {
      return next(new AppError("Role name already exists", 400));
    }
    role.name = name;
  }

  // Update permissions if provided
  if (permissions && Array.isArray(permissions)) {
    const existingPermissionIds = role.permission.map((id) => id.toString());
    const newPermissionIds = [];

    // Process each provided permission
    for (const perm of permissions) {
      const { sectionName, isSection, isCreate, isRead, isUpdate, isDelete } = perm;

      // Find existing permission by sectionName
      const existingPermission = await Permission.findOne({
        _id: { $in: role.permission },
        sectionName,
      });

      if (existingPermission) {
        // Update existing permission
        existingPermission.isSection = isSection ?? existingPermission.isSection;
        existingPermission.isCreate = isCreate ?? existingPermission.isCreate;
        existingPermission.isRead = isRead ?? existingPermission.isRead;
        existingPermission.isUpdate = isUpdate ?? existingPermission.isUpdate;
        existingPermission.isDelete = isDelete ?? existingPermission.isDelete;
        await existingPermission.save();
        newPermissionIds.push(existingPermission._id);
      } else {
        // Create new permission
        const newPermission = await Permission.create({
          sectionName: sectionName ?? "",
          isSection: isSection ?? false,
          isCreate: isCreate ?? false,
          isRead: isRead ?? false,
          isUpdate: isUpdate ?? false,
          isDelete: isDelete ?? false,
        });
        newPermissionIds.push(newPermission._id);
      }
    }

    // Optionally remove permissions not included in the provided list
    if (removeUnlistedPermissions) {
      const permissionsToRemove = existingPermissionIds.filter(
        (id) => !newPermissionIds.includes(id)
      );
      await Permission.deleteMany({ _id: { $in: permissionsToRemove } });
    }

    // Update role's permission array
    role.permission = newPermissionIds;
  }

  await role.save();

  // Populate permissions for response
  const updatedRole = await Role.findById(id).populate("permission").lean();

  res.status(200).json({
    status: true,
    message: "Role updated successfully",
    data: {
      role: updatedRole,
    },
  });
});