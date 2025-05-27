const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
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

dotenv.config({ path: "config.env" });

const { PORT = 7000, DB_URL } = process.env;

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

app.locals.io = io;

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

  socket.on("sendChatRequest", async ({ userId, astrologerId }) => {
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
      });

      if (astrologers[astrologerId]?.socketId) {
        io.to(astrologers[astrologerId].socketId).emit("chatRequestReceived", {
          chatRequestId: chatRequest._id,
          userId,
          userName: user.name || "Unknown",
          createdAt: chatRequest.createdAt,
        });
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
          });

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
                  type: "chat",
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
          await astrologer.save();

          if (users[chatRequest.user._id]?.socketId) {
            io.to(users[chatRequest.user._id].socketId).emit(
              "chatRequestAccepted",
              {
                chatSessionId: chatSession._id,
                astrologerId,
                astrologerName: astrologer.name,
              }
            );
          }
          socket.emit("chatSessionStarted", {
            chatSessionId: chatSession._id,
            userId: chatRequest.user._id,
            userName: chatRequest.user.name,
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
          await Astrologer.findByIdAndUpdate(id, { status: "offline" });
          socket.broadcast.emit("astrologerStatus", {
            astrologerId: id,
            status: "offline",
            isBusy: false,
          });
          delete astrologers[id];
          break;
        }
      }
    } catch (error) {
      console.error("Disconnect event error:", error.message);
    }
  });

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
