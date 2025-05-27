const mongoose = require("mongoose");
const admin = require("firebase-admin");
const { Server } = require("socket.io");
const User = require("./src/models/user");
const Astrologer = require("./src/models/astrologer");
const AppError = require("./src/utils/AppError");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "recipientModel",
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ["User", "Astrologer"],
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel",
  },
  senderModel: { type: String, required: true, enum: ["User", "Astrologer"] },
  type: {
    type: String,
    enum: [
      "chat_request",
      "chat_accepted",
      "chat_rejected",
      "chat_ended",
      "new_message",
      "astrologer_status",
    ],
    required: true,
  },
  message: { type: String, required: true },
  chatSession: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession" },
  status: { type: String, enum: ["unread", "read"], default: "unread" },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel",
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "recipientModel",
  },
  senderModel: { type: String, required: true, enum: ["User", "Astrologer"] },
  recipientModel: {
    type: String,
    required: true,
    enum: ["User", "Astrologer"],
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  deletedForSender: { type: Boolean, default: false },
  deletedForRecipient: { type: Boolean, default: false },
  deletedForEveryone: { type: Boolean, default: false },
  chatSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession",
    required: true,
  },
});

const Message = mongoose.model("Message", messageSchema);

// Chat Request Schema
const chatRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
});

const ChatRequest = mongoose.model("ChatRequest", chatRequestSchema);

// Chat Session Schema
const chatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  chatRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRequest",
    required: true,
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  status: { type: String, enum: ["active", "ended"], default: "active" },
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

// Socket.IO and Firebase Integration
const initializeChat = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PATCH", "DELETE"] },
    pingTimeout: 60000,
  });

  const connectedUsers = new Map();
  const connectedAstrologers = new Map();

  io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    // Handle user/astrologer join
    socket.on("join", async ({ id, type }) => {
      try {
        if (!id || !["user", "astrologer"].includes(type)) {
          socket.emit("error", { message: "Invalid join parameters" });
          return;
        }

        const Model = type === "user" ? User : Astrologer;
        const entity = await Model.findById(id);

        if (!entity) {
          socket.emit("error", { message: `${type} not found` });
          return;
        }

        const collection =
          type === "user" ? connectedUsers : connectedAstrologers;
        collection.set(id.toString(), {
          socketId: socket.id,
          status: "online",
        });

        // Update status for astrologers
        if (type === "astrologer") {
          await Astrologer.findByIdAndUpdate(id, { status: "online" });
          // Notify all users about astrologer status
          await Notification.create({
            recipient: id,
            recipientModel: "Astrologer",
            sender: id,
            senderModel: "Astrologer",
            type: "astrologer_status",
            message: `${entity.name} is now online`,
          });
          io.emit("statusUpdate", { id, type, status: "online" });
        }

        socket.emit("joinSuccess", {
          id,
          type,
          message: "Joined successfully",
        });
      } catch (error) {
        socket.emit("error", { message: `Join failed: ${error.message}` });
      }
    });

    // Handle chat request
    socket.on("sendChatRequest", async ({ userId, astrologerId }) => {
      try {
        const astrologer = await Astrologer.findById(astrologerId);
        const user = await User.findById(userId);

        if (!astrologer || !user) {
          socket.emit("error", { message: "User or astrologer not found" });
          return;
        }

        if (astrologer.isBusy || astrologer.status === "offline") {
          socket.emit("error", {
            message: "Astrologer is currently unavailable",
          });
          return;
        }

        // Check for existing pending request
        const existingRequest = await ChatRequest.findOne({
          user: userId,
          astrologer: astrologerId,
          status: "pending",
        });

        if (existingRequest) {
          socket.emit("error", { message: "Chat request already pending" });
          return;
        }

        const chatRequest = await ChatRequest.create({
          user: userId,
          astrologer: astrologerId,
        });

        const notification = await Notification.create({
          recipient: astrologerId,
          recipientModel: "Astrologer",
          sender: userId,
          senderModel: "User",
          type: "chat_request",
          message: `${user.name} has sent you a chat request`,
          chatSession: null,
        });

        if (connectedAstrologers.get(astrologerId.toString())) {
          io.to(
            connectedAstrologers.get(astrologerId.toString()).socketId
          ).emit("chatRequestReceived", {
            chatRequestId: chatRequest._id,
            userId,
            userName: user.name,
          });
        }

        await sendFirebaseNotification(
          astrologerId,
          "Astrologer",
          "New Chat Request",
          `${user.name} wants to chat with you`
        );

        socket.emit("chatRequestSent", { chatRequestId: chatRequest._id });
      } catch (error) {
        socket.emit("error", {
          message: `Chat request failed: ${error.message}`,
        });
      }
    });

    // Handle chat request response
    socket.on(
      "respondChatRequest",
      async ({ chatRequestId, astrologerId, action }) => {
        try {
          const chatRequest = await ChatRequest.findById(chatRequestId);
          if (!chatRequest) {
            socket.emit("error", { message: "Chat request not found" });
            return;
          }

          if (chatRequest.astrologer.toString() !== astrologerId.toString()) {
            socket.emit("error", { message: "Unauthorized action" });
            return;
          }

          const astrologer = await Astrologer.findById(astrologerId);
          if (astrologer.isBusy && action === "accept") {
            socket.emit("error", { message: "You are already in a chat" });
            return;
          }

          chatRequest.status = action;
          chatRequest.respondedAt = new Date();
          await chatRequest.save();

          const user = await User.findById(chatRequest.user);
          let chatSession = null;

          if (action === "accept") {
            chatSession = await ChatSession.create({
              user: chatRequest.user,
              astrologer: astrologerId,
              chatRequest: chatRequestId,
            });

            await Astrologer.findByIdAndUpdate(astrologerId, { isBusy: true });

            await Notification.create({
              recipient: chatRequest.user,
              recipientModel: "User",
              sender: astrologerId,
              senderModel: "Astrologer",
              type: "chat_accepted",
              message: `${astrologer.name} has accepted your chat request`,
              chatSession: chatSession._id,
            });

            if (connectedUsers.get(chatRequest.user.toString())) {
              io.to(
                connectedUsers.get(chatRequest.user.toString()).socketId
              ).emit("chatInitiated", {
                chatSessionId: chatSession._id,
                astrologerId,
              });
            }

            if (connectedAstrologers.get(astrologerId.toString())) {
              io.to(
                connectedAstrologers.get(astrologerId.toString()).socketId
              ).emit("chatInitiated", {
                chatSessionId: chatSession._id,
                userId: chatRequest.user,
              });
            }

            await sendFirebaseNotification(
              chatRequest.user,
              "User",
              "Chat Accepted",
              `${astrologer.name} has accepted your chat request`
            );
          } else {
            await Notification.create({
              recipient: chatRequest.user,
              recipientModel: "User",
              sender: astrologerId,
              senderModel: "Astrologer",
              type: "chat_rejected",
              message: `${astrologer.name} has rejected your chat request`,
              chatSession: null,
            });

            if (connectedUsers.get(chatRequest.user.toString())) {
              io.to(
                connectedUsers.get(chatRequest.user.toString()).socketId
              ).emit("chatRequestRejected", { chatRequestId });
            }

            await sendFirebaseNotification(
              chatRequest.user,
              "User",
              "Chat Rejected",
              `${astrologer.name} has rejected your chat request`
            );
          }

          socket.emit("chatRequestResponded", {
            chatRequestId,
            action,
            chatSessionId: chatSession?._id,
          });
        } catch (error) {
          socket.emit("error", {
            message: `Chat request response failed: ${error.message}`,
          });
        }
      }
    );

    // Handle message sending
    socket.on(
      "sendMessage",
      async ({
        chatSessionId,
        senderId,
        senderType,
        recipientId,
        recipientType,
        messageText,
      }) => {
        try {
          const chatSession = await ChatSession.findById(chatSessionId);

          if (!chatSession || chatSession.status !== "active") {
            socket.emit("error", {
              message: "Invalid or inactive chat session",
            });
            return;
          }

          const message = await Message.create({
            sender: senderId,
            recipient: recipientId,
            senderModel: senderType,
            recipientModel: recipientType,
            message: messageText,
            chatSession: chatSessionId,
          });

          const populatedMessage = await Message.findById(message._id)
            .populate("sender", "name")
            .populate("recipient", "name");

          const messageData = {
            _id: message._id,
            chatSessionId,
            senderId,
            senderType,
            recipientId,
            recipientType,
            message: message.message,
            timestamp: message.timestamp,
            isRead: message.isRead,
            senderName: populatedMessage.sender?.name || "Unknown",
            recipientName: populatedMessage.recipient?.name || "Unknown",
          };

          const notification = await Notification.create({
            recipient: recipientId,
            recipientModel: recipientType,
            sender: senderId,
            senderModel: senderType,
            type: "new_message",
            message: `${
              populatedMessage.sender?.name || "Someone"
            }: ${messageText.substring(0, 50)}...`,
            chatSession: chatSessionId,
          });

          const recipientSocket =
            recipientType === "user"
              ? connectedUsers.get(recipientId.toString())
              : connectedAstrologers.get(recipientId.toString());

          if (recipientSocket) {
            io.to(recipientSocket.socketId).emit("newMessage", messageData);
            io.to(recipientSocket.socketId).emit("notification", {
              notificationId: notification._id,
              type: "new_message",
              message: notification.message,
              chatSessionId,
            });
          }

          socket.emit("messageSent", messageData);

          await storeMessageInFirebase(messageData);
          await sendFirebaseNotification(
            recipientId,
            recipientType,
            "New Message",
            `${
              populatedMessage.sender?.name || "Someone"
            }: ${messageText.substring(0, 50)}...`
          );
        } catch (error) {
          socket.emit("error", {
            message: `Message sending failed: ${error.message}`,
          });
        }
      }
    );

    // Handle chat termination
    socket.on("endChat", async ({ chatSessionId, userId, userType }) => {
      try {
        const chatSession = await ChatSession.findById(chatSessionId);

        if (!chatSession) {
          socket.emit("error", { message: "Chat session not found" });
          return;
        }

        await ChatSession.findByIdAndUpdate(chatSessionId, {
          status: "ended",
          endedAt: new Date(),
        });

        await Astrologer.findByIdAndUpdate(chatSession.astrologer, {
          isBusy: false,
        });

        const user = await User.findById(chatSession.user);
        const astrologer = await Astrologer.findById(chatSession.astrologer);

        await Notification.create({
          recipient: chatSession.user,
          recipientModel: "User",
          sender: chatSession.astrologer,
          senderModel: "Astrologer",
          type: "chat_ended",
          message: `Chat with ${astrologer.name} has ended`,
          chatSession: chatSessionId,
        });

        await Notification.create({
          recipient: chatSession.astrologer,
          recipientModel: "Astrologer",
          sender: chatSession.user,
          senderModel: "User",
          type: "chat_ended",
          message: `Chat with ${user.name} has ended`,
          chatSession: chatSessionId,
        });

        if (connectedUsers.get(chatSession.user.toString())) {
          io.to(connectedUsers.get(chatSession.user.toString()).socketId).emit(
            "chatEnded",
            { chatSessionId }
          );
          io.to(connectedUsers.get(chatSession.user.toString()).socketId).emit(
            "notification",
            {
              notificationId: mongoose.Types.ObjectId(),
              type: "chat_ended",
              message: `Chat with ${astrologer.name} has ended`,
              chatSessionId,
            }
          );
        }

        if (connectedAstrologers.get(chatSession.astrologer.toString())) {
          io.to(
            connectedAstrologers.get(chatSession.astrologer.toString()).socketId
          ).emit("chatEnded", { chatSessionId });
          io.to(
            connectedAstrologers.get(chatSession.astrologer.toString()).socketId
          ).emit("notification", {
            notificationId: mongoose.Types.ObjectId(),
            type: "chat_ended",
            message: `Chat with ${user.name} has ended`,
            chatSessionId,
          });
        }

        await sendFirebaseNotification(
          chatSession.user,
          "User",
          "Chat Ended",
          `Your chat with ${astrologer.name} has ended`
        );
        await sendFirebaseNotification(
          chatSession.astrologer,
          "Astrologer",
          "Chat Ended",
          `Your chat with ${user.name} has ended`
        );
      } catch (error) {
        socket.emit("error", {
          message: `Chat termination failed: ${error.message}`,
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        let disconnectedId, disconnectedType;

        for (const [id, user] of connectedUsers) {
          if (user.socketId === socket.id) {
            disconnectedId = id;
            disconnectedType = "user";
            connectedUsers.delete(id);
            break;
          }
        }

        if (!disconnectedId) {
          for (const [id, astrologer] of connectedAstrologers) {
            if (astrologer.socketId === socket.id) {
              disconnectedId = id;
              disconnectedType = "astrologer";
              connectedAstrologers.delete(id);
              await Astrologer.findByIdAndUpdate(id, {
                status: "offline",
                isBusy: false,
              });

              await Notification.create({
                recipient: id,
                recipientModel: "Astrologer",
                sender: id,
                senderModel: "Astrologer",
                type: "astrologer_status",
                message: `${
                  (
                    await Astrologer.findById(id)
                  ).name
                } is now offline`,
              });

              io.emit("statusUpdate", {
                id,
                type: "astrologer",
                status: "offline",
              });
              break;
            }
          }
        }

        if (disconnectedId) {
          io.emit("statusUpdate", {
            id: disconnectedId,
            type: disconnectedType,
            status: "offline",
          });
        }
      } catch (error) {
        console.error("Disconnect error:", error);
      }
    });
  });

  // Firebase helper functions
  async function storeMessageInFirebase(messageData) {
    try {
      await admin
        .firestore()
        .collection("messages")
        .doc(messageData._id.toString())
        .set({
          ...messageData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Error storing message in Firebase:", error);
    }
  }

  async function sendFirebaseNotification(
    recipientId,
    recipientType,
    title,
    body
  ) {
    try {
      const Model = recipientType === "User" ? User : Astrologer;
      const recipient = await Model.findById(recipientId);
      if (!recipient || !recipient.fcmToken) return;

      const message = {
        notification: { title, body },
        token: recipient.fcmToken,
      };

      await admin.messaging().send(message);
    } catch (error) {
      console.error("Error sending Firebase notification:", error);
    }
  }

  return io;
};

module.exports = {
  initializeChat,
  Message,
  ChatSession,
  Notification,
  ChatRequest,
};
