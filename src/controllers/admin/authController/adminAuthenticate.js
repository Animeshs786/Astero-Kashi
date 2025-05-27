const jwt = require("jsonwebtoken");

const Admin = require("../../../models/admin");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

exports.adminAuthenticate = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization?.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookie?.xcvbexamstons) {
    token = req.cookie?.xcvbexamstons;
  }

  if (!token) {
    return next(new AppError("You are not logedin.", 404));
  }

  // token verify
  const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

  //Step3. check user not removed
  const user = await Admin.findById(decoded.id);
  if (!user) {
    return next(new AppError("Admin not exist.", 404));
  }

  //Step4. check password update
  if (await user.validatePasswordUpdate(decoded.iat)) {
    return next(new AppError("Password updated login again.", 404));
  }

  req.user = user;
  next();
});
