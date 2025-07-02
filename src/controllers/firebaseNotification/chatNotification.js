const admin = require("../../firebase/firebase");
const AppError = require("../../utils/AppError");

async function chatNotificaion(token, title, body, data = {}) {
  console.log(data,"dadaa in chatNotificaion");
  console.log(body,"body in chatNotificaion");
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data, // Includes chatSessionId, senderId, senderType, recipientId, recipientType, senderProfileImage, recipientProfileImage
      token,
    };
    const response = await admin.messaging().send(message);
    console.log("FCM chat notification sent:", response);
    return response;
  } catch (error) {
    console.error("Error sending FCM chat notification:", error);
    throw new AppError("Failed to send chat notification", 500);
  }
}

module.exports = { chatNotificaion };
