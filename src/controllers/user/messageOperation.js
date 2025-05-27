const Message = require("../../models/message");
const User = require("../../models/user");
const ChatSession = require("../../models/chatSession");
const AppError = require("../../utils/AppError");
const Astrologer = require("../../models/asteroLogerSchema");

exports.sendMessage = async (senderId, recipientId, messageText, senderType, recipientType, chatSessionId) => {
  try {
    console.log("sendMessage called with:", {
      senderId,
      recipientId,
      messageText,
      senderType,
      recipientType,
      chatSessionId,
    });

    if (!senderId || !recipientId || !messageText || !senderType || !recipientType || !chatSessionId) {
      throw new AppError("All fields are required", 400);
    }

    // Validate chat session
    const chatSession = await ChatSession.findById(chatSessionId);
    if (!chatSession || chatSession.status !== "active") {
      throw new AppError("Invalid or inactive chat session", 400);
    }

    // Validate sender and recipient
    const senderModel = senderType === "User" ? User : Astrologer;
    const recipientModel = recipientType === "User" ? User : Astrologer;
    const sender = await senderModel.findById(senderId);
    const recipient = await recipientModel.findById(recipientId);

    if (!sender || !recipient) {
      throw new AppError(`${senderType} or ${recipientType} not found`, 404);
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      senderModel: senderType,
      recipientModel: recipientType,
      message: messageText,
      chatSession: chatSessionId,
      timestamp: new Date(),
      isRead: false,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name")
      .populate("recipient", "name");

    const messageData = {
      _id: populatedMessage._id,
      sender: populatedMessage.sender?._id,
      recipient: populatedMessage.recipient?._id,
      senderModel: populatedMessage.senderModel,
      recipientModel: populatedMessage.recipientModel,
      message: populatedMessage.message,
      chatSession: populatedMessage.chatSession,
      timestamp: populatedMessage.timestamp,
      isRead: populatedMessage.isRead,
      edited: populatedMessage.edited,
      deletedForSender: populatedMessage.deletedForSender,
      deletedForRecipient: populatedMessage.deletedForRecipient,
      deletedForEveryone: populatedMessage.deletedForEveryone,
      senderName: populatedMessage.sender?.name || "Unknown",
      recipientName: populatedMessage.recipient?.name || "Unknown",
    };

    return messageData;
  } catch (error) {
    console.error("sendMessage error:", error);
    throw error;
  }
};

exports.editMessage = async (messageId, userId, newMessageText) => {
  try {
    console.log("editMessage called with:", { messageId, userId, newMessageText });
    if (!messageId || !userId || !newMessageText) {
      throw new AppError("Message ID, user ID, and new message text are required", 400);
    }

    const message = await Message.findById(messageId);
    if (!message) throw new AppError("Message not found", 404);
    if (message.sender.toString() !== userId.toString())
      throw new AppError("Unauthorized", 403);
    if (message.timestamp < new Date(Date.now() - 15 * 60 * 1000)) {
      throw new AppError("Message edit time limit (15 minutes) exceeded", 403);
    }

    message.message = newMessageText;
    message.edited = true;
    await message.save();

    return message;
  } catch (error) {
    console.error("editMessage error:", error);
    throw error;
  }
};

exports.deleteMessage = async (messageId, userId, forEveryone) => {
  try {
    console.log("deleteMessage called with:", { messageId, userId, forEveryone });
    if (!messageId || !userId) {
      throw new AppError("Message ID and user ID are required", 400);
    }

    const message = await Message.findById(messageId);
    if (!message) throw new AppError("Message not found", 404);

    if (forEveryone) {
      if (message.sender.toString() !== userId.toString())
        throw new AppError("Unauthorized", 403);
      message.deletedForEveryone = true;
    } else {
      if (message.sender.toString() === userId.toString()) {
        message.deletedForSender = true;
      } else if (message.recipient.toString() === userId.toString()) {
        message.deletedForRecipient = true;
      } else {
        throw new AppError("Unauthorized", 403);
      }
    }

    await message.save();
    return message;
  } catch (error) {
    console.error("deleteMessage error:", error);
    throw error;
  }
};

exports.markMessagesAsRead = async (senderId, recipientId) => {
  try {
    console.log("markMessagesAsRead called with:", { senderId, recipientId });
    if (!senderId || !recipientId) {
      throw new AppError("Sender ID and Recipient ID are required", 400);
    }

    const messages = await Message.updateMany(
      { sender: senderId, recipient: recipientId, isRead: false },
      { isRead: true }
    );

    return messages;
  } catch (error) {
    console.error("markMessagesAsRead error:", error);
    throw error;
  }
};