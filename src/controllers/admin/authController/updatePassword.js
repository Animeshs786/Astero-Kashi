const Admin = require("../../../models/admin");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const createToken = require("../../../utils/createToken");

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await Admin.findById(req.user._id).select("+password");

    const { currentPassword, password } = req.body;

    if (!currentPassword || !password) {
        return next(
            new AppError("Please provide current and new password.", 404)
        );
    }

    if (!(await user.comparePassword(req.body.currentPassword))) {
        return next(new AppError("Current password is wrong.", 404));
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordUpdatedAt = Date.now();
    await user.save();

    createToken(user, 200, res);
});
