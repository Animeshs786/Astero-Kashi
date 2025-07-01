const Astrologer = require("../../../models/asteroLogerSchema");
const Notify = require("../../../models/notify");
const User = require("../../../models/user");
const AppError = require("../../../utils/AppError");

exports.notifyAstrologer = async (req, res, next) => {
  try {
    const { astrologerId, title, message, type } = req.body;

    const userId = req.user._id; 
    // Validate input
    if (!userId || !astrologerId || !title || !message) {
      return next(
        new AppError(
          "User ID, astrologer ID, title, and message are required",
          400
        )
      );
    }
    if (!["chat", "video", "voice"].includes(type)) {
      return next(new AppError("Invalid notification type", 400));
    }

    // Verify user and astrologer
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
      return next(new AppError("Astrologer not found", 404));
    }

    // Create notification in database
    const notification = await Notify.create({
      user: userId,
      astrologer: astrologerId,
      title,
      message,
      type,
    });

    res.status(201).json({
      status: true,
      message: "Notification sent successfully",
      data: notification,
    });
  } catch (error) {
    next(new AppError(`Failed to send notification: ${error.message}`, 500));
  }
};
