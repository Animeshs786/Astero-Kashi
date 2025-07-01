const admin = require("../../firebase/firebase");
const AppError = require("../../utils/AppError");

async function statusNotification(token, title, body, data = {}) {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data, // Includes astrologerId, status
      token,
    };
    const response = await admin.messaging().send(message);
    console.log("FCM status notification sent:", response);
    return response;
  } catch (error) {
    console.error("Error sending FCM status notification:", error);
    throw new AppError("Failed to send status notification", 500);
  }
}

module.exports = { statusNotification };
