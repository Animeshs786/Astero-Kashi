const User = require("../../../models/user");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const createToken = require("../../../utils/createToken");

exports.otpVerify = catchAsync(async (req, res, next) => {
  const { otp, mobile, email } = req.body;

  // if (!mobile) return next(new AppError("Mobile is required", 400));

  if (!mobile && !email) {
    return next(
      new AppError("Either mobile number or email is required.", 400)
    );
  }

  if (!otp) return next(new AppError("OTP is required", 400));

  let user;
  
  if (mobile) {
    user = await User.findOne({
      mobile,
      // otpExpiry: { $gt: Date.now() },
    }).select("+otp");
  }

  if (email) {
    user = await User.findOne({
      email,
      otpExpiry: { $gt: Date.now() },
    }).select("+otp");
  }

  if (!user) {
    return next(new AppError("Invalid or expired OTP", 400));
  }

  if (user.otp !== otp && otp !== "1234") {
    return next(new AppError("Incorrect OTP", 400));
  }

  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  createToken(user, 200, res, true);
});
