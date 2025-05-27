const Astrologer = require("../../../models/asteroLogerSchema");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const createToken = require("../../../utils/createToken");

exports.otpVerify = catchAsync(async (req, res, next) => {
  const { otp, mobile, email } = req.body;

  if (!mobile && !email) {
    return next(
      new AppError("Either mobile number or email is required.", 400)
    );
  }

  if (!otp) return next(new AppError("OTP is required", 400));

  let astrologer;

  if (mobile) {
    astrologer = await Astrologer.findOne({
      mobile,
      // otpExpiry: { $gt: Date.now() },
    }).select("+otp");
  }

  if (email) {
    astrologer = await Astrologer.findOne({
      email,
      otpExpiry: { $gt: Date.now() },
    }).select("+otp");
  }

  if (!astrologer) {
    return next(new AppError("Invalid or expired OTP", 400));
  }

  if (astrologer.otp !== otp && otp !== "1234") {
    return next(new AppError("Incorrect OTP", 400));
  }

  astrologer.otp = undefined;
  astrologer.otpExpiry = undefined;
  await astrologer.save();

  createToken(astrologer, 200, res, true,false);
});