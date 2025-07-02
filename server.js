const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const app = require("./src/app");
const User = require("./src/models/user");
const ChatRequest = require("./src/models/chatRequest");
const ChatSession = require("./src/models/chatSession");
const Astrologer = require("./src/models/asteroLogerSchema");
const AppError = require("./src/utils/AppError");
const {
  sendMessage,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
} = require("./src/controllers/user/messageOperation");
const Transaction = require("./src/models/transaction");
const {
  generateTransactionInvoice,
} = require("./src/controllers/invoice/invoice");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const {
  chatNotificaion,
} = require("./src/controllers/firebaseNotification/chatNotification");
const {
  statusNotification,
} = require("./src/controllers/firebaseNotification/statusNotification");

dotenv.config({ path: "config.env" });

const {
  PORT = 7000,
  DB_URL,
  AGORA_APP_ID,
  AGORA_APP_CERTIFICATE,
  KNOWLARITY_CALLER_ID,
  KNOWLARITY_AUTH_TOKEN,
  KNOWLARITY_API_KEY,
} = process.env;

// Initialize MongoDB connection
let dbConnection;

const connectDB = async () => {
  try {
    dbConnection = await mongoose.connect(DB_URL);
    console.log("Database connection established successfully");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

// Connect to MongoDB before starting the server
connectDB();

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
  pingTimeout: 60000,
});

// Store connected users, astrologers, and chat timers
const users = {};
const astrologers = {};
const chatTimers = {};
const videoCallTimers = {};
const voiceCallTimers = {};

app.locals.io = io;

// Generate Agora Token
const generateAgoraToken = (channelName, uid, role = RtcRole.PUBLISHER) => {
  const expirationTimeInSeconds = 3600; // Token valid for 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  return RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
};

const initiateKnowlarityCall = async (
  userNumber,
  astrologerNumber,
  userWalletBalance,
  astrologerRatePerMinute
) => {
  try {
    const maxDuration =
      Math.floor(userWalletBalance / astrologerRatePerMinute) * 60; // Convert to seconds
    const response = await axios.post(
      "https://kpi.knowlarity.com/Basic/v1/account/call/makecall",
      {
        k_number: KNOWLARITY_CALLER_ID,
        agent_number: "+91" + astrologerNumber,
        customer_number: "+91" + userNumber,
        caller_id: KNOWLARITY_CALLER_ID,
        additional_params: {
          timeout: maxDuration,
          callback_url: "https://astrokashi.in/call-status-webhook",
        },
      },
      {
        headers: {
          authorization: KNOWLARITY_AUTH_TOKEN,
          "x-api-key": KNOWLARITY_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Knowlarity call initiated:", response.data);

    console.log("max duration call", maxDuration);

    return response.data;
  } catch (error) {
    console.error(
      "Knowlarity call error:",
      error.response?.data || error.message
    );
    throw new AppError("Failed to initiate voice call", 500);
  }
};

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  socket.on("join", async ({ id, type }) => {
    console.log(`Join event: id=${id}, type=${type}`);
    if (!id || !["user", "astrologer"].includes(type)) {
      socket.emit("error", { message: "Invalid id or type" });
      return;
    }

    try {
      if (mongoose.connection.readyState !== 1) {
        socket.emit("error", { message: "Database not connected" });
        return;
      }

      let entity;
      if (type === "user") {
        entity = await User.findById(id);
        if (!entity) {
          socket.emit("error", { message: "User not found" });
          return;
        }
        users[id] = { socketId: socket.id, type: "user" };
        socket.broadcast.emit("userStatus", { userId: id, status: "online" });
      } else {
        entity = await Astrologer.findById(id);
        if (!entity) {
          socket.emit("error", { message: "Astrologer not found" });
          return;
        }
        astrologers[id] = { socketId: socket.id, type: "astrologer" };
        socket.broadcast.emit("astrologerStatus", {
          astrologerId: id,
          status: entity.status,
          isBusy: entity.isBusy,
        });
        await Astrologer.findByIdAndUpdate(id, { status: "online" });
      }

      socket.emit("joinSuccess", { id, type, message: "Joined successfully" });
    } catch (error) {
      console.error("Join event error:", error.message);
      socket.emit("error", { message: `Failed to join: ${error.message}` });
    }
  });
  //chat code starte here
  // socket.on("sendChatRequest", async ({ userId, astrologerId, memberData }) => {
  //   try {
  //     if (!userId || !astrologerId) {
  //       throw new AppError("User ID and Astrologer ID are required", 400);
  //     }

  //     const astrologer = await Astrologer.findById(astrologerId);
  //     if (!astrologer) {
  //       throw new AppError("Astrologer not found", 404);
  //     }
  //     if (astrologer.isBusy || astrologer.status === "offline") {
  //       throw new AppError("Astrologer is busy or offline", 400);
  //     }

  //     const user = await User.findById(userId);
  //     if (!user) {
  //       throw new AppError("User not found", 404);
  //     }

  //     const chatPrice = astrologer.pricing.chat;
  //     if (user.wallet.balance < chatPrice) {
  //       throw new AppError(
  //         `Insufficient balance. Please recharge your wallet. Minimum required: ${chatPrice}`,
  //         400
  //       );
  //     }

  //     const chatRequest = await ChatRequest.create({
  //       user: userId,
  //       astrologer: astrologerId,
  //       status: "pending",
  //       memberData: memberData ? memberData : [],
  //     });

  //     if (astrologers[astrologerId]?.socketId) {
  //       io.to(astrologers[astrologerId].socketId).emit("chatRequestReceived", {
  //         chatRequestId: chatRequest._id,
  //         userId,
  //         userName: user.name || "Unknown",
  //         createdAt: chatRequest.createdAt,
  //       });
  //     }

  //     socket.emit("chatRequestSent", {
  //       chatRequestId: chatRequest._id,
  //       astrologerId,
  //       status: "pending",
  //     });
  //   } catch (error) {
  //     socket.emit("error", {
  //       status: false,
  //       message: `Failed to send chat request: ${error.message}`,
  //     });
  //   }
  // });
  socket.on("sendChatRequest", async ({ userId, astrologerId, memberData }) => {
    try {
      if (!userId || !astrologerId) {
        throw new AppError("User ID and Astrologer ID are required", 400);
      }

      const astrologer = await Astrologer.findById(astrologerId);
      if (!astrologer) {
        throw new AppError("Astrologer not found", 404);
      }
      if (astrologer.isBusy || astrologer.status === "offline") {
        throw new AppError("Astrologer is busy or offline", 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const chatPrice = astrologer.pricing.chat;
      if (user.wallet.balance < chatPrice) {
        throw new AppError(
          `Insufficient balance. Please recharge your wallet. Minimum required: ${chatPrice}`,
          400
        );
      }

      const chatRequest = await ChatRequest.create({
        user: userId,
        astrologer: astrologerId,
        status: "pending",
        memberData: memberData ? memberData : [],
      });

      // Send chat request notification to astrologer
      if (astrologers[astrologerId]?.socketId) {
        io.to(astrologers[astrologerId].socketId).emit("chatRequestReceived", {
          chatRequestId: chatRequest._id,
          userId,
          userName: user.name || "Unknown",
          createdAt: chatRequest.createdAt,
        });
      }

      console.log("Chat request created:", astrologer);

      // Send chat request notification to astrologer via Firebase
      if (astrologer.fcmToken) {
        await chatNotificaion(
          "fiSbcW_PQ7qMPZH6cN4ZwJ:APA91bEc908FyN4GSIyUtFgGjVTcBp65cbkG-TLQ9kFn6FKwtzSquKQKzEVI8kRYf0S9VVaAXqaOLFReiYyW5SMCWQfuc6pPipTeEMDSWlAv9rshNZeEPgc",//astrologer.fcmToken,
          "New Chat Request",
          `You have a new chat request from ${user.name || "Unknown"}`,
          {
            chatRequestId: chatRequest._id.toString(),
            userId: userId.toString(),
            userName: user.name || "Unknown",
          }
        );
      }

      socket.emit("chatRequestSent", {
        chatRequestId: chatRequest._id,
        astrologerId,
        status: "pending",
      });
    } catch (error) {
      socket.emit("error", {
        status: false,
        message: `Failed to send chat request: ${error.message}`,
      });
    }
  });
  socket.on(
    "respondChatRequest",
    async ({ chatRequestId, astrologerId, action }) => {
      try {
        if (!["accept", "reject"].includes(action)) {
          throw new AppError("Invalid action", 400);
        }

        const chatRequest = await ChatRequest.findById(chatRequestId).populate(
          "user"
        );
        if (!chatRequest) {
          throw new AppError("Chat request not found", 404);
        }
        if (chatRequest.astrologer.toString() !== astrologerId) {
          throw new AppError("Unauthorized", 403);
        }
        if (chatRequest.status !== "pending") {
          throw new AppError("Chat request already responded", 400);
        }

        if (chatRequest.status === "notRespond") {
          throw new AppError("Chat request session expired", 400);
        }

        const astrologer = await Astrologer.findById(astrologerId);
        if (action === "accept" && astrologer.isBusy) {
          throw new AppError("Astrologer is already busy", 400);
        }

        chatRequest.status = action;
        chatRequest.respondedAt = new Date();
        await chatRequest.save();

        if (action === "accept") {
          const user = await User.findById(chatRequest.user._id);
          const maxWaitingTime = Math.ceil(
            user.wallet.balance / astrologer.pricing.chat
          );
          const chatPrice = astrologer.pricing.chat;

          user.wallet.balance -= chatPrice;
          user.wallet.lockedBalance += chatPrice;
          await user.save({ validateBeforeSave: false });

          // Emit wallet update
          if (users[chatRequest.user._id]?.socketId) {
            io.to(users[chatRequest.user._id].socketId).emit("walletUpdate", {
              balance: user.wallet.balance,
              lockedBalance: user.wallet.lockedBalance,
            });
          }

          const chatSession = await ChatSession.create({
            user: chatRequest.user._id,
            astrologer: astrologerId,
            chatRequest: chatRequestId,
            status: "active",
            startedAt: new Date(),
            type: chatRequest.type, // Use type from ChatRequest
          });

          // Send automatic message with memberData
          if (chatRequest.memberData && chatRequest.memberData.length > 0) {
            const memberDataText = chatRequest.memberData
              .map((member) => {
                const fields = [
                  `Name: ${member.name}`,
                  `Gender: ${member.gender}`,
                  member.dob ? `Date of Birth: ${member.dob}` : null,
                  member.birthTime ? `Birth Time: ${member.birthTime}` : null,
                  member.placeOfBirth
                    ? `Place of Birth: ${member.placeOfBirth}`
                    : null,
                ].filter((field) => field !== null); // Remove null fields
                return fields.join("\n");
              })
              .join("\n\n"); // Separate multiple members with double newline

            const messageData = await sendMessage(
              chatRequest.user._id,
              astrologerId,
              memberDataText,
              "User",
              "Astrologer",
              chatSession._id
            );
            // Emit message to astrologer
            if (astrologers[astrologerId]?.socketId) {
              io.to(astrologers[astrologerId].socketId).emit(
                "newMessage",
                messageData
              );
            }

            // Emit message to user
            if (users[chatRequest.user._id]?.socketId) {
              io.to(users[chatRequest.user._id].socketId).emit(
                "newMessage",
                messageData
              );
            }
          }

          const timer = setInterval(async () => {
            try {
              const session = await ChatSession.findById(chatSession._id);
              if (!session || session.status !== "active") {
                clearInterval(timer);
                delete chatTimers[chatSession._id.toString()];
                return;
              }

              const currentUser = await User.findById(chatRequest.user._id);
              if (currentUser.wallet.balance < chatPrice) {
                session.status = "ended";
                session.endedAt = new Date();
                await session.save();

                astrologer.isBusy = false;
                await astrologer.save();

                // Calculate duration in minutes
                const duration = Math.floor(
                  (session.endedAt - session.startedAt) / 1000 / 60
                );
                const totalAmount = chatPrice * duration;

                // Create a single transaction record
                const transaction = await Transaction.create({
                  amount: totalAmount,
                  user: chatRequest.user._id,
                  astrologer: astrologerId,
                  description: `Chat with ${
                    astrologer.name
                  } for ${duration} minute${duration > 1 ? "s" : ""}`,
                  status: "success",
                  type: chatRequest.type, // Use type from ChatRequest
                  duration: `${duration}`,
                });
                await generateTransactionInvoice(transaction._id);
                const totalLocked = currentUser.wallet.lockedBalance;
                if (totalLocked > 0) {
                  await Astrologer.findByIdAndUpdate(astrologerId, {
                    $inc: { "wallet.lockedBalance": totalLocked },
                  });
                  currentUser.wallet.lockedBalance = 0;
                  await currentUser.save({ validateBeforeSave: false });

                  // Emit wallet update
                  if (users[chatRequest.user._id]?.socketId) {
                    io.to(users[chatRequest.user._id].socketId).emit(
                      "walletUpdate",
                      {
                        balance: currentUser.wallet.balance,
                        lockedBalance: currentUser.wallet.lockedBalance,
                      }
                    );
                  }
                }

                if (users[chatRequest.user._id]?.socketId) {
                  io.to(users[chatRequest.user._id].socketId).emit(
                    "chatSessionEnded",
                    {
                      chatSessionId: chatSession._id,
                      reason: "Insufficient balance",
                    }
                  );
                }
                if (astrologers[astrologerId]?.socketId) {
                  io.to(astrologers[astrologerId].socketId).emit(
                    "chatSessionEnded",
                    {
                      chatSessionId: chatSession._id,
                      reason: "Insufficient balance",
                    }
                  );
                }
                io.emit("astrologerStatus", {
                  astrologerId,
                  status: astrologer.status,
                  isBusy: false,
                });

                clearInterval(timer);
                delete chatTimers[chatSession._id.toString()];
                return;
              }

              currentUser.wallet.balance -= chatPrice;
              currentUser.wallet.lockedBalance += chatPrice;
              await currentUser.save({ validateBeforeSave: false });

              // Emit wallet update
              if (users[chatRequest.user._id]?.socketId) {
                io.to(users[chatRequest.user._id].socketId).emit(
                  "walletUpdate",
                  {
                    balance: currentUser.wallet.balance,
                    lockedBalance: currentUser.wallet.lockedBalance,
                  }
                );
              }
            } catch (error) {
              console.error("Timer error:", error.message);
              clearInterval(timer);
              delete chatTimers[chatSession._id.toString()];
            }
          }, 60000);

          chatTimers[chatSession._id.toString()] = timer;

          astrologer.isBusy = true;
          astrologer.maxWaitingTime = maxWaitingTime;
          await astrologer.save();

          if (users[chatRequest.user._id]?.socketId) {
            io.to(users[chatRequest.user._id].socketId).emit(
              "chatRequestAccepted",
              {
                chatSessionId: chatSession._id,
                astrologerId,
                astrologerName: astrologer.name,
                profileImage: astrologer.profileImage,
              }
            );
          }
          socket.emit("chatSessionStarted", {
            chatSessionId: chatSession._id,
            userId: chatRequest.user._id,
            userName: chatRequest.user.name,
            profileImage: chatRequest.user.profileImage,
          });

          io.emit("astrologerStatus", {
            astrologerId,
            status: astrologer.status,
            isBusy: true,
          });
        } else {
          if (users[chatRequest.user._id]?.socketId) {
            io.to(users[chatRequest.user._id].socketId).emit(
              "chatRequestRejected",
              {
                chatRequestId,
                astrologerId,
              }
            );
          }
          socket.emit("chatRequestResponded", {
            chatRequestId,
            status: "rejected",
          });
        }
      } catch (error) {
        socket.emit("error", {
          message: `Failed to respond to chat request: ${error.message}`,
        });
      }
    }
  );

  socket.on(
    "sendMessage",
    async ({ chatSessionId, senderId, senderType, messageText }) => {
      try {
        const chatSession = await ChatSession.findById(chatSessionId).populate(
          "user astrologer"
        );
        if (!chatSession || chatSession.status !== "active") {
          throw new AppError("Invalid or inactive chat session", 400);
        }

        const recipientId =
          senderType === "User"
            ? chatSession.astrologer._id
            : chatSession.user._id;
        const recipientType = senderType === "User" ? "Astrologer" : "User";

        const messageData = await sendMessage(
          senderId,
          recipientId,
          messageText,
          senderType,
          recipientType,
          chatSessionId
        );

        const recipientSocket =
          recipientType === "User"
            ? users[recipientId]?.socketId
            : astrologers[recipientId]?.socketId;

        if (recipientSocket) {
          io.to(recipientSocket).emit("newMessage", messageData);
        } else {
          // Recipient is offline, send push notification
          const recipientModel = recipientType === "User" ? User : Astrologer;
          const recipient = await recipientModel.findById(recipientId);
          const sender = await (senderType === "User"
            ? User
            : Astrologer
          ).findById(senderId);

          if (recipient && recipient.fcmToken) {
            await chatNotificaion(
              recipient.fcmToken,
              `New Message from ${sender.name || "Unknown"}`,
              messageText,
              {
                chatSessionId: chatSessionId.toString(),
                senderId: senderId.toString(),
                senderType,
                recipientId: recipientId.toString(),
                recipientType,
                senderProfileImage: sender.profileImage || "", // Include sender's profile image
                recipientProfileImage: recipient.profileImage || "", // Include recipient's profile image
              }
            );
          }
        }

        socket.emit("messageSent", messageData);
      } catch (error) {
        socket.emit("messageError", {
          message: `Failed to send message: ${error.message}`,
        });
      }
    }
  );

  socket.on("endChatSession", async ({ chatSessionId, userId, userType }) => {
    console.log(chatSessionId, userId, userType, "end chat");
    try {
      const chatSession = await ChatSession.findById(chatSessionId).populate(
        "user astrologer"
      );
      if (!chatSession || chatSession.status !== "active") {
        throw new AppError("Invalid or inactive chat session", 400);
      }

      if (
        (userType === "user" && chatSession.user._id.toString() !== userId) ||
        (userType === "astrologer" &&
          chatSession.astrologer._id.toString() !== userId)
      ) {
        throw new AppError("Unauthorized", 403);
      }

      chatSession.status = "ended";
      chatSession.endedAt = new Date();
      await chatSession.save();

      const astrologer = await Astrologer.findById(chatSession.astrologer._id);
      const user = await User.findById(chatSession.user._id);

      // Calculate duration in minutes
      const duration = Math.ceil(
        (chatSession.endedAt - chatSession.startedAt) / 1000 / 60
      );
      const totalAmount = astrologer.pricing.chat * duration;

      // Create a single transaction record
      const transaction = await Transaction.create({
        amount: totalAmount,
        user: chatSession.user._id,
        astrologer: chatSession.astrologer._id,
        description: `Chat with ${astrologer.name} for ${duration} minute${
          duration > 1 ? "s" : ""
        }`,
        status: "success",
        type: "chat",
        duration: `${duration} minute${duration > 1 ? "s" : ""}`,
      });
      await generateTransactionInvoice(transaction._id);
      // Transfer the total locked amount to astrologer's lockedBalance
      const totalLocked = user.wallet.lockedBalance;
      if (totalLocked > 0) {
        await Astrologer.findByIdAndUpdate(chatSession.astrologer._id, {
          $inc: { "wallet.lockedBalance": totalLocked },
        });

        user.wallet.lockedBalance = 0;
        await user.save({ validateBeforeSave: false });

        // Emit wallet update to user
        if (users[chatSession.user._id]?.socketId) {
          io.to(users[chatSession.user._id].socketId).emit("walletUpdate", {
            balance: user.wallet.balance,
            lockedBalance: user.wallet.lockedBalance,
          });
        }
      }

      astrologer.isBusy = false;
      await astrologer.save();

      // Notify both user and astrologer about session end
      if (users[chatSession.user._id]?.socketId) {
        io.to(users[chatSession.user._id].socketId).emit("chatSessionEnded", {
          chatSessionId,
          reason: "Session ended by user",
        });
      }
      if (astrologers[chatSession.astrologer._id]?.socketId) {
        io.to(astrologers[chatSession.astrologer._id].socketId).emit(
          "chatSessionEnded",
          {
            chatSessionId,
            reason: "Session ended by user",
          }
        );
      }

      io.emit("astrologerStatus", {
        astrologerId: chatSession.astrologer._id,
        status: astrologer.status,
        isBusy: false,
      });

      // Clear the chat timer
      if (chatTimers[chatSession._id.toString()]) {
        clearInterval(chatTimers[chatSession._id.toString()]);
        delete chatTimers[chatSession._id.toString()];
      }
    } catch (error) {
      socket.emit("error", {
        message: `Failed to end chat session: ${error.message}`,
      });
    }
  });

  socket.on("editMessage", async ({ messageId, userId, newMessageText }) => {
    try {
      const message = await editMessage(messageId, userId, newMessageText);
      const recipientSocket =
        message.senderModel === "User"
          ? astrologers[message.recipient.toString()]?.socketId
          : users[message.recipient.toString()]?.socketId;
      if (recipientSocket) {
        io.to(recipientSocket).emit("messageUpdated", message);
      }
      socket.emit("messageEdited", message);
    } catch (error) {
      socket.emit("messageError", { error: error.message });
    }
  });

  socket.on("deleteMessage", async ({ messageId, userId, forEveryone }) => {
    try {
      const message = await deleteMessage(messageId, userId, forEveryone);
      const recipientSocket =
        message.senderModel === "User"
          ? astrologers[message.recipient.toString()]?.socketId
          : users[message.recipient.toString()]?.socketId;
      if (recipientSocket && message.sender.toString() !== userId.toString()) {
        io.to(recipientSocket).emit("messageDeleted", {
          messageId,
          forEveryone: message.deletedForEveryone,
        });
      }
      socket.emit("messageDeleted", {
        messageId,
        forEveryone: message.deletedForEveryone,
      });
    } catch (error) {
      socket.emit("messageError", { error: error.message });
    }
  });

  socket.on("markMessagesAsRead", async ({ senderId, recipientId }) => {
    try {
      await markMessagesAsRead(senderId, recipientId);
      const senderSocket =
        senderId in users
          ? users[senderId].socketId
          : astrologers[senderId]?.socketId;
      if (senderSocket) {
        io.to(senderSocket).emit("messagesRead", { recipientId });
      }
      socket.emit("messagesMarkedAsRead", { senderId, recipientId });
    } catch (error) {
      socket.emit("messageError", { error: error.message });
    }
  });

  socket.on("typing", ({ senderId, recipientId, senderType }) => {
    const recipientSocket =
      senderType === "user"
        ? astrologers[recipientId]?.socketId
        : users[recipientId]?.socketId;
    if (recipientSocket) {
      io.to(recipientSocket).emit("userTyping", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, recipientId, senderType }) => {
    const recipientSocket =
      senderType === "user"
        ? astrologers[recipientId]?.socketId
        : users[recipientId]?.socketId;
    if (recipientSocket) {
      io.to(recipientSocket).emit("userStoppedTyping", { senderId });
    }
  });

  //video call start here

  socket.on("sendVideoCallRequest", async ({ userId, astrologerId }) => {
    try {
      if (!userId || !astrologerId) {
        throw new AppError("User ID and Astrologer ID are required", 400);
      }

      const astrologer = await Astrologer.findById(astrologerId);
      if (!astrologer) {
        throw new AppError("Astrologer not found", 404);
      }
      if (
        astrologer.isBusy ||
        astrologer.status === "offline" ||
        !astrologer.services.video
      ) {
        throw new AppError(
          "Astrologer is busy, offline, or video service unavailable",
          400
        );
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const videoPrice = astrologer.pricing.video;
      if (user.wallet.balance < videoPrice) {
        throw new AppError(
          `Insufficient balance. Please recharge your wallet. Minimum required: ${videoPrice}`,
          400
        );
      }

      const videoCallRequest = await ChatRequest.create({
        user: userId,
        astrologer: astrologerId,
        status: "pending",
        type: "video",
      });

      if (astrologers[astrologerId]?.socketId) {
        io.to(astrologers[astrologerId].socketId).emit(
          "videoCallRequestReceived",
          {
            videoCallRequestId: videoCallRequest._id,
            userId,
            userName: user.name || "Unknown",
            createdAt: videoCallRequest.createdAt,
          }
        );
      }

      socket.emit("videoCallRequestSent", {
        videoCallRequestId: videoCallRequest._id,
        astrologerId,
        status: "pending",
      });
    } catch (error) {
      socket.emit("error", {
        status: false,
        message: `Failed to send video call request: ${error.message}`,
      });
    }
  });

  socket.on(
    "respondVideoCallRequest",
    async ({ videoCallRequestId, astrologerId, action }) => {
      try {
        if (!["accept", "reject"].includes(action)) {
          throw new AppError("Invalid action", 400);
        }

        const videoCallRequest = await ChatRequest.findById(
          videoCallRequestId
        ).populate("user");
        if (!videoCallRequest) {
          throw new AppError("Video call request not found", 404);
        }
        if (videoCallRequest.astrologer.toString() !== astrologerId) {
          throw new AppError("Unauthorized", 403);
        }
        if (videoCallRequest.status !== "pending") {
          throw new AppError("Video call request already responded", 400);
        }

        const astrologer = await Astrologer.findById(astrologerId);
        if (action === "accept" && astrologer.isBusy) {
          throw new AppError("Astrologer is already busy", 400);
        }

        videoCallRequest.status = action;
        videoCallRequest.respondedAt = new Date();
        await videoCallRequest.save();

        if (action === "accept") {
          const user = await User.findById(videoCallRequest.user._id);
          const videoPrice = astrologer.pricing.video;

          user.wallet.balance -= videoPrice;
          user.wallet.lockedBalance += videoPrice;
          await user.save({ validateBeforeSave: false });

          if (users[videoCallRequest.user._id]?.socketId) {
            io.to(users[videoCallRequest.user._id].socketId).emit(
              "walletUpdate",
              {
                balance: user.wallet.balance,
                lockedBalance: user.wallet.lockedBalance,
              }
            );
          }

          const videoCallSession = await ChatSession.create({
            user: videoCallRequest.user._id,
            astrologer: astrologerId,
            chatRequest: videoCallRequestId,
            status: "active",
            startedAt: new Date(),
            type: "video",
          });

          const channelName = `video_${videoCallSession._id}`;
          const userUid = parseInt(
            videoCallRequest.user._id.toString().slice(-6),
            16
          );
          const astrologerUid = parseInt(astrologerId.toString().slice(-6), 16);
          const userToken = generateAgoraToken(channelName, userUid);
          const astrologerToken = generateAgoraToken(
            channelName,
            astrologerUid
          );
          console.log(userToken, astrologerToken, "sljflsfjlsdfjsssssssss");

          const timer = setInterval(async () => {
            try {
              const session = await ChatSession.findById(videoCallSession._id);
              if (!session || session.status !== "active") {
                clearInterval(timer);
                delete videoCallTimers[videoCallSession._id.toString()];
                return;
              }

              const currentUser = await User.findById(
                videoCallRequest.user._id
              );
              if (currentUser.wallet.balance < videoPrice) {
                session.status = "ended";
                session.endedAt = new Date();
                await session.save();

                astrologer.isBusy = false;
                await astrologer.save();

                const duration = Math.ceil(
                  (session.endedAt - session.startedAt) / 1000 / 60
                );
                const totalAmount = videoPrice * duration;

                const transaction = await Transaction.create({
                  amount: totalAmount,
                  user: videoCallRequest.user._id,
                  astrologer: astrologerId,
                  description: `Video call with ${
                    astrologer.name
                  } for ${duration} minute${duration > 1 ? "s" : ""}`,
                  status: "success",
                  type: "video",
                  duration: `${duration} minute${duration > 1 ? "s" : ""}`,
                });
                await generateTransactionInvoice(transaction._id);

                const totalLocked = currentUser.wallet.lockedBalance;
                if (totalLocked > 0) {
                  await Astrologer.findByIdAndUpdate(astrologerId, {
                    $inc: { "wallet.lockedBalance": totalLocked },
                  });
                  currentUser.wallet.lockedBalance = 0;
                  await currentUser.save({ validateBeforeSave: false });

                  if (users[videoCallRequest.user._id]?.socketId) {
                    io.to(users[videoCallRequest.user._id].socketId).emit(
                      "walletUpdate",
                      {
                        balance: currentUser.wallet.balance,
                        lockedBalance: currentUser.wallet.lockedBalance,
                      }
                    );
                  }
                }

                if (users[videoCallRequest.user._id]?.socketId) {
                  io.to(users[videoCallRequest.user._id].socketId).emit(
                    "videoCallSessionEnded",
                    {
                      videoCallSessionId: videoCallSession._id,
                      reason: "Insufficient balance",
                    }
                  );
                }
                if (astrologers[astrologerId]?.socketId) {
                  io.to(astrologers[astrologerId].socketId).emit(
                    "videoCallSessionEnded",
                    {
                      videoCallSessionId: videoCallSession._id,
                      reason: "Insufficient balance",
                    }
                  );
                }
                io.emit("astrologerStatus", {
                  astrologerId,
                  status: astrologer.status,
                  isBusy: false,
                });

                clearInterval(timer);
                delete videoCallTimers[videoCallSession._id.toString()];
                return;
              }

              currentUser.wallet.balance -= videoPrice;
              currentUser.wallet.lockedBalance += videoPrice;
              await currentUser.save({ validateBeforeSave: false });

              if (users[videoCallRequest.user._id]?.socketId) {
                io.to(users[videoCallRequest.user._id].socketId).emit(
                  "walletUpdate",
                  {
                    balance: currentUser.wallet.balance,
                    lockedBalance: currentUser.wallet.lockedBalance,
                  }
                );
              }
            } catch (error) {
              console.error("Video call timer error:", error.message);
              clearInterval(timer);
              delete videoCallTimers[videoCallSession._id.toString()];
            }
          }, 60000);

          videoCallTimers[videoCallSession._id.toString()] = timer;

          astrologer.isBusy = true;
          await astrologer.save();

          console.log(
            videoCallSession,
            astrologerId,
            astrologer.name,
            channelName,
            userToken,
            userUid
          );

          if (users[videoCallRequest.user._id]?.socketId) {
            io.to(users[videoCallRequest.user._id].socketId).emit(
              "videoCallRequestAccepted",
              {
                videoCallSessionId: videoCallSession._id,
                astrologerId,
                astrologerName: astrologer.name,
                channelName,
                token: userToken,
                uid: userUid,
              }
            );
          }
          socket.emit("videoCallSessionStarted", {
            videoCallSessionId: videoCallSession._id,
            userId: videoCallRequest.user._id,
            userName: videoCallRequest.user.name,
            channelName,
            token: astrologerToken,
            uid: astrologerUid,
          });

          io.emit("astrologerStatus", {
            astrologerId,
            status: astrologer.status,
            isBusy: true,
          });
        } else {
          if (users[videoCallRequest.user._id]?.socketId) {
            io.to(users[videoCallRequest.user._id].socketId).emit(
              "videoCallRequestRejected",
              {
                videoCallRequestId,
                astrologerId,
              }
            );
          }
          socket.emit("videoCallRequestResponded", {
            videoCallRequestId,
            status: "rejected",
          });
        }
      } catch (error) {
        socket.emit("error", {
          message: `Failed to respond to video call request: ${error.message}`,
        });
      }
    }
  );

  socket.on(
    "endVideoCallSession",
    async ({ videoCallSessionId, userId, userType }) => {
      try {
        const videoCallSession = await ChatSession.findById(
          videoCallSessionId
        ).populate("user astrologer");
        if (!videoCallSession || videoCallSession.status !== "active") {
          throw new AppError("Invalid or inactive video call session", 400);
        }

        if (
          (userType === "user" &&
            videoCallSession.user._id.toString() !== userId) ||
          (userType === "astrologer" &&
            videoCallSession.astrologer._id.toString() !== userId)
        ) {
          throw new AppError("Unauthorized", 403);
        }

        videoCallSession.status = "ended";
        videoCallSession.endedAt = new Date();
        await videoCallSession.save();

        const astrologer = await Astrologer.findById(
          videoCallSession.astrologer._id
        );
        const user = await User.findById(videoCallSession.user._id);

        const duration = Math.ceil(
          (videoCallSession.endedAt - videoCallSession.startedAt) / 1000 / 60
        );
        const totalAmount = astrologer.pricing.video * duration;

        const transaction = await Transaction.create({
          amount: totalAmount,
          user: videoCallSession.user._id,
          astrologer: videoCallSession.astrologer._id,
          description: `Video call with ${
            astrologer.name
          } for ${duration} minute${duration > 1 ? "s" : ""}`,
          status: "success",
          type: "video",
          duration: `${duration} minute${duration > 1 ? "s" : ""}`,
        });
        await generateTransactionInvoice(transaction._id);

        const totalLocked = user.wallet.lockedBalance;
        if (totalLocked > 0) {
          await Astrologer.findByIdAndUpdate(videoCallSession.astrologer._id, {
            $inc: { "wallet.lockedBalance": totalLocked },
          });
          user.wallet.lockedBalance = 0;
          await user.save({ validateBeforeSave: false });

          if (users[videoCallSession.user._id]?.socketId) {
            io.to(users[videoCallSession.user._id].socketId).emit(
              "walletUpdate",
              {
                balance: user.wallet.balance,
                lockedBalance: user.wallet.lockedBalance,
              }
            );
          }
        }

        astrologer.isBusy = false;
        await astrologer.save();

        if (users[videoCallSession.user._id]?.socketId) {
          io.to(users[videoCallSession.user._id].socketId).emit(
            "videoCallSessionEnded",
            {
              videoCallSessionId,
              reason: "Session ended by user",
            }
          );
        }
        if (astrologers[videoCallSession.astrologer._id]?.socketId) {
          io.to(astrologers[videoCallSession.astrologer._id].socketId).emit(
            "videoCallSessionEnded",
            {
              videoCallSessionId,
              reason: "Session ended by user",
            }
          );
        }

        io.emit("astrologerStatus", {
          astrologerId: videoCallSession.astrologer._id,
          status: astrologer.status,
          isBusy: false,
        });

        if (videoCallTimers[videoCallSession._id.toString()]) {
          clearInterval(videoCallTimers[videoCallSession._id.toString()]);
          delete videoCallTimers[videoCallSession._id.toString()];
        }
      } catch (error) {
        socket.emit("error", {
          message: `Failed to end video call session: ${error.message}`,
        });
      }
    }
  );

  // New Voice Call Handlers
  socket.on("sendVoiceCallRequest", async ({ userId, astrologerId }) => {
    try {
      if (!userId || !astrologerId) {
        throw new AppError("User ID and Astrologer ID are required", 400);
      }

      const astrologer = await Astrologer.findById(astrologerId);
      if (!astrologer) {
        throw new AppError("Astrologer not found", 404);
      }
      if (
        astrologer.isBusy ||
        astrologer.status === "offline" ||
        !astrologer.services.voice
      ) {
        throw new AppError(
          "Astrologer is busy, offline, or voice service unavailable",
          400
        );
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }
      console.log(
        user.wallet.balance,
        astrologer.pricing.voice,
        "++++++++++++++++++++++++++++++++++++++++++++"
      );
      const voicePrice = astrologer.pricing.voice;
      if (user.wallet.balance < voicePrice) {
        throw new AppError(
          `Insufficient balance. Please recharge your wallet. Minimum required: ${voicePrice}`,
          400
        );
      }

      const voiceCallRequest = await ChatRequest.create({
        user: userId,
        astrologer: astrologerId,
        status: "pending",
        type: "voice",
      });

      if (astrologers[astrologerId]?.socketId) {
        io.to(astrologers[astrologerId].socketId).emit(
          "voiceCallRequestReceived",
          {
            voiceCallRequestId: voiceCallRequest._id,
            userId,
            userName: user.name || "Unknown",
            createdAt: voiceCallRequest.createdAt,
          }
        );
      }

      socket.emit("voiceCallRequestSent", {
        voiceCallRequestId: voiceCallRequest._id,
        astrologerId,
        status: "pending",
      });
    } catch (error) {
      socket.emit("error", {
        status: false,
        message: `Failed to send voice call request: ${error.message}`,
      });
    }
  });

  socket.on(
    "respondVoiceCallRequest",
    async ({ voiceCallRequestId, astrologerId, action }) => {
      try {
        if (!["accept", "reject"].includes(action)) {
          throw new AppError("Invalid action", 400);
        }

        const voiceCallRequest = await ChatRequest.findById(
          voiceCallRequestId
        ).populate("user");
        if (!voiceCallRequest) {
          throw new AppError("Voice call request not found", 404);
        }
        if (voiceCallRequest.astrologer.toString() !== astrologerId) {
          throw new AppError("Unauthorized", 403);
        }
        if (voiceCallRequest.status !== "pending") {
          throw new AppError("Voice call request already responded", 400);
        }

        const astrologer = await Astrologer.findById(astrologerId);
        if (action === "accept" && astrologer.isBusy) {
          throw new AppError("Astrologer is already busy", 400);
        }

        voiceCallRequest.status = action;
        voiceCallRequest.respondedAt = new Date();
        await voiceCallRequest.save();

        if (action === "accept") {
          const user = await User.findById(voiceCallRequest.user._id);
          const voicePrice = astrologer.pricing.voice;

          user.wallet.balance -= voicePrice;
          user.wallet.lockedBalance += voicePrice;
          await user.save({ validateBeforeSave: false });

          if (users[voiceCallRequest.user._id]?.socketId) {
            io.to(users[voiceCallRequest.user._id].socketId).emit(
              "walletUpdate",
              {
                balance: user.wallet.balance,
                lockedBalance: user.wallet.lockedBalance,
              }
            );
          }

          const voiceCallSession = await ChatSession.create({
            user: voiceCallRequest.user._id,
            astrologer: astrologerId,
            chatRequest: voiceCallRequestId,
            status: "active",
            startedAt: new Date(),
            type: "voice",
          });

          // Initiate Knowlarity voice call
          const knowlarityRes = await initiateKnowlarityCall(
            user.mobile,
            astrologer.mobile,
            user.wallet.balance + voicePrice,
            voicePrice
          );

          const timer = setInterval(async () => {
            try {
              const session = await ChatSession.findById(voiceCallSession._id);
              if (!session || session.status !== "active") {
                clearInterval(timer);
                delete voiceCallTimers[voiceCallSession._id.toString()];
                return;
              }

              const currentUser = await User.findById(
                voiceCallRequest.user._id
              );
              if (currentUser.wallet.balance < voicePrice) {
                session.status = "ended";
                session.endedAt = new Date();
                await session.save();

                astrologer.isBusy = false;
                await astrologer.save();

                const duration = Math.ceil(
                  (session.endedAt - session.startedAt) / 1000 / 60
                );
                const totalAmount = voicePrice * duration;

                const transaction = await Transaction.create({
                  amount: totalAmount,
                  user: voiceCallRequest.user._id,
                  astrologer: astrologerId,
                  description: `Voice call with ${
                    astrologer.name
                  } for ${duration} minute${duration > 1 ? "s" : ""}`,
                  status: "success",
                  type: "voice",
                  duration: `${duration} minute${duration > 1 ? "s" : ""}`,
                });
                await generateTransactionInvoice(transaction._id);

                const totalLocked = currentUser.wallet.lockedBalance;
                if (totalLocked > 0) {
                  await Astrologer.findByIdAndUpdate(astrologerId, {
                    $inc: { "wallet.lockedBalance": totalLocked },
                  });
                  currentUser.wallet.lockedBalance = 0;
                  await currentUser.save({ validateBeforeSave: false });

                  if (users[voiceCallRequest.user._id]?.socketId) {
                    io.to(users[voiceCallRequest.user._id].socketId).emit(
                      "walletUpdate",
                      {
                        balance: currentUser.wallet.balance,
                        lockedBalance: currentUser.wallet.lockedBalance,
                      }
                    );
                  }
                }

                if (users[voiceCallRequest.user._id]?.socketId) {
                  io.to(users[voiceCallRequest.user._id].socketId).emit(
                    "voiceCallSessionEnded",
                    {
                      voiceCallSessionId: voiceCallSession._id,
                      reason: "Insufficient balance",
                    }
                  );
                }
                if (astrologers[astrologerId]?.socketId) {
                  io.to(astrologers[astrologerId].socketId).emit(
                    "voiceCallSessionEnded",
                    {
                      voiceCallSessionId: voiceCallSession._id,
                      reason: "Insufficient balance",
                    }
                  );
                }
                io.emit("astrologerStatus", {
                  astrologerId,
                  status: astrologer.status,
                  isBusy: false,
                });

                clearInterval(timer);
                delete voiceCallTimers[voiceCallSession._id.toString()];
                return;
              }

              currentUser.wallet.balance -= voicePrice;
              currentUser.wallet.lockedBalance += voicePrice;
              await currentUser.save({ validateBeforeSave: false });

              if (users[voiceCallRequest.user._id]?.socketId) {
                io.to(users[voiceCallRequest.user._id].socketId).emit(
                  "walletUpdate",
                  {
                    balance: currentUser.wallet.balance,
                    lockedBalance: currentUser.wallet.lockedBalance,
                  }
                );
              }
            } catch (error) {
              console.error("Voice call timer error:", error.message);
              clearInterval(timer);
              delete voiceCallTimers[voiceCallSession._id.toString()];
            }
          }, 60000);

          voiceCallTimers[voiceCallSession._id.toString()] = timer;

          astrologer.isBusy = true;
          await astrologer.save();

          if (users[voiceCallRequest.user._id]?.socketId) {
            io.to(users[voiceCallRequest.user._id].socketId).emit(
              "voiceCallRequestAccepted",
              {
                voiceCallSessionId: voiceCallSession._id,
                astrologerId,
                astrologerName: astrologer.name,
              }
            );
          }
          socket.emit("voiceCallSessionStarted", {
            voiceCallSessionId: voiceCallSession._id,
            userId: voiceCallRequest.user._id,
            userName: voiceCallRequest.user.name,
          });

          io.emit("astrologerStatus", {
            astrologerId,
            status: astrologer.status,
            isBusy: true,
          });
        } else {
          if (users[voiceCallRequest.user._id]?.socketId) {
            io.to(users[voiceCallRequest.user._id].socketId).emit(
              "voiceCallRequestRejected",
              {
                voiceCallRequestId,
                astrologerId,
              }
            );
          }
          socket.emit("voiceCallRequestResponded", {
            voiceCallRequestId,
            status: "rejected",
          });
        }
      } catch (error) {
        socket.emit("error", {
          message: `Failed to respond to voice call request: ${error.message}`,
        });
      }
    }
  );

  socket.on(
    "endVoiceCallSession",
    async ({ voiceCallSessionId, userId, userType }) => {
      try {
        const voiceCallSession = await ChatSession.findById(
          voiceCallSessionId
        ).populate("user astrologer");
        if (!voiceCallSession || voiceCallSession.status !== "active") {
          throw new AppError("Invalid or inactive voice call session", 400);
        }

        if (
          (userType === "user" &&
            voiceCallSession.user._id.toString() !== userId) ||
          (userType === "astrologer" &&
            voiceCallSession.astrologer._id.toString() !== userId)
        ) {
          throw new AppError("Unauthorized", 403);
        }

        voiceCallSession.status = "ended";
        voiceCallSession.endedAt = new Date();
        await voiceCallSession.save();

        const astrologer = await Astrologer.findById(
          voiceCallSession.astrologer._id
        );
        const user = await User.findById(voiceCallSession.user._id);

        const duration = Math.ceil(
          (voiceCallSession.endedAt - voiceCallSession.startedAt) / 1000 / 60
        );
        const totalAmount = astrologer.pricing.voice * duration;

        const transaction = await Transaction.create({
          amount: totalAmount,
          user: voiceCallSession.user._id,
          astrologer: voiceCallSession.astrologer._id,
          description: `Voice call with ${
            astrologer.name
          } for ${duration} minute${duration > 1 ? "s" : ""}`,
          status: "success",
          type: "voice",
          duration: `${duration} minute${duration > 1 ? "s" : ""}`,
        });
        await generateTransactionInvoice(transaction._id);

        const totalLocked = user.wallet.lockedBalance;
        if (totalLocked > 0) {
          await Astrologer.findByIdAndUpdate(voiceCallSession.astrologer._id, {
            $inc: { "wallet.lockedBalance": totalLocked },
          });
          user.wallet.lockedBalance = 0;
          await user.save({ validateBeforeSave: false });

          if (users[voiceCallSession.user._id]?.socketId) {
            io.to(users[voiceCallSession.user._id].socketId).emit(
              "walletUpdate",
              {
                balance: user.wallet.balance,
                lockedBalance: user.wallet.lockedBalance,
              }
            );
          }
        }

        astrologer.isBusy = false;
        await astrologer.save();

        if (users[voiceCallSession.user._id]?.socketId) {
          io.to(users[voiceCallSession.user._id].socketId).emit(
            "voiceCallSessionEnded",
            {
              voiceCallSessionId,
              reason: "Session ended by user",
            }
          );
        }
        if (astrologers[voiceCallSession.astrologer._id]?.socketId) {
          io.to(astrologers[voiceCallSession.astrologer._id].socketId).emit(
            "voiceCallSessionEnded",
            {
              voiceCallSessionId,
              reason: "Session ended by user",
            }
          );
        }

        io.emit("astrologerStatus", {
          astrologerId: voiceCallSession.astrologer._id,
          status: astrologer.status,
          isBusy: false,
        });

        if (voiceCallTimers[voiceCallSession._id.toString()]) {
          clearInterval(voiceCallTimers[voiceCallSession._id.toString()]);
          delete voiceCallTimers[voiceCallSession._id.toString()];
        }
      } catch (error) {
        socket.emit("error", {
          message: `Failed to end voice call session: ${error.message}`,
        });
      }
    }
  );

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    try {
      for (const [id, user] of Object.entries(users)) {
        if (user.socketId === socket.id) {
          delete users[id];
          socket.broadcast.emit("userStatus", {
            userId: id,
            status: "offline",
          });
          break;
        }
      }
      for (const [id, astrologer] of Object.entries(astrologers)) {
        if (astrologer.socketId === socket.id) {
          delete astrologers[id];
          // Do not update status to offline in the database
          break;
        }
      }
    } catch (error) {
      console.error("Disconnect event error:", error.message);
    }
  });

  // socket.on("disconnect", async () => {
  //   console.log("Client disconnected:", socket.id);
  //   try {
  //     for (const [id, user] of Object.entries(users)) {
  //       if (user.socketId === socket.id) {
  //         delete users[id];
  //         socket.broadcast.emit("userStatus", {
  //           userId: id,
  //           status: "offline",
  //         });
  //         break;
  //       }
  //     }
  //     for (const [id, astrologer] of Object.entries(astrologers)) {
  //       if (astrologer.socketId === socket.id) {
  //         await Astrologer.findByIdAndUpdate(id, { status: "offline" });
  //         socket.broadcast.emit("astrologerStatus", {
  //           astrologerId: id,
  //           status: "offline",
  //           isBusy: false,
  //         });
  //         delete astrologers[id];
  //         break;
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Disconnect event error:", error.message);
  //   }
  // });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

process.on("unhandledRejection", async (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message, err.stack);
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    server.close(() => {
      process.exit(1);
    });
  } catch (closeErr) {
    console.error("Error closing server:", closeErr);
    process.exit(1);
  }
});
