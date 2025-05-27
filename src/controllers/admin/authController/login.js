const Admin = require("../../../models/admin");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const createToken = require("../../../utils/createToken");

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Email and password are required.", 404));

  const user = await Admin.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password)))
    return next(new AppError("Invalid email or password.", 404));

  user.password = undefined;
  createToken(user, 200, res);
});
