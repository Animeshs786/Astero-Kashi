const Astrologer = require("../../../models/asteroLogerSchema");
const Notify = require("../../../models/notify");
const User = require("../../../models/user");
const AppError = require("../../../utils/AppError");
const {
  statusNotification,
} = require("../../firebaseNotification/statusNotification");

// Get all notifications for an astrologer
exports.userNotifyList = async (req, res, next) => {
  try {
    const astrologerId = req.user._id;
    const { type, page = 1, limit = 10 } = req.query;

    // Verify astrologer
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
      return next(new AppError("Astrologer not found", 404));
    }

    // Build query
    const query = { astrologer: astrologerId };
    if (type && ["chat", "video", "voice"].includes(type)) {
      query.type = type;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch notifications
    const notifications = await Notify.find(query)
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notify.countDocuments(query);

    res.status(200).json({
      status: true,
      message: "Notifications retrieved successfully",
      data: {
        notifications,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(
      new AppError(`Failed to retrieve notifications: ${error.message}`, 500)
    );
  }
};

// Notify a specific user when astrologer is free for a service
exports.notifyToUser = async (req, res, next) => {
  try {
    const { notifyId } = req.body;

    // Validate input
    if (!notifyId) {
      return next(new AppError("Notification ID is required", 400));
    }

    // Find the notification
    const notification = await Notify.findById(notifyId)
      .populate("user")
      .populate("astrologer");
    if (!notification) {
      return next(new AppError("Notification not found", 404));
    }

    // Verify user exists
    const user = await User.findById(notification.user._id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Generate title and message
    const title = `${
      notification.astrologer.name || "Astrologer"
    } is Available`;
    const message = `${
      notification.astrologer.name || "Astrologer"
    } is now free for ${notification.type} consultations.`;

    // Send Firebase notification to user
    if (user.fcmToken) {
      await statusNotification(user.fcmToken, title, message, {
        notificationId: notification._id.toString(),
        userId: notification.user._id.toString(),
        astrologerId: notification.astrologer._id.toString(),
        astrologerName: notification.astrologer.name || "Unknown",
        type: notification.type,
      });
    }

    res.status(201).json({
      status: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    next(
      new AppError(
        `Failed to send free service notification: ${error.message}`,
        500
      )
    );
  }
};
