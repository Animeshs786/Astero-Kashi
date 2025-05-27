const jwt = require("jsonwebtoken");

const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const Astrologer = require("../../../models/asteroLogerSchema");

exports.asterologerAuthenticate = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization?.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookie?.sfvbexamstons) {
    token = req.cookie?.sfvbexamstons;
  }

  if (!token) {
    return next(new AppError("You are not logedin.", 404));
  }

  // token verify
  const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

  const user = await Astrologer.findById(decoded.id);
  if (!user) {
    return next(new AppError("User not exist.", 404));
  }

  req.user = user;
  next();
});
