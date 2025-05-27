const mongoose = require("mongoose");
const ChatRequest = require("../../../models/chatRequest");
const ChatSession = require("../../../models/chatSession");
const Astrologer = require("../../../models/asteroLogerSchema");
const Transaction = require("../../../models/transaction");
const AppError = require("../../../utils/AppError");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const User = require("../../../models/user");
const { generateTransactionInvoice } = require("../../invoice/invoice");
require("dotenv").config({ path: "config.env" });

const { AGORA_APP_ID, AGORA_APP_CERTIFICATE } = process.env;

// Store video call timers
const videoCallTimers = {};

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

const setupVideoCallSocket = (io, users, astrologers, chatTimers) => {
  io.on("connection", (socket) => {
    socket.on("sendVideoCallRequest", async ({ userId, astrologerId }) => {
      try {
        if (!userId || !astrologerId) {
          throw new AppError("User ID and Astrologer ID are required", 400);
        }

        const astrologer = await Astrologer.findById(astrologerId);
        if (!astrologer) {
          throw new AppError("Astrologer not found", 404);
        }
        if (astrologer.isBusy || astrologer.status === "offline" || !astrologer.services.video) {
          throw new AppError("Astrologer is busy, offline, or video service unavailable", 400);
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
          io.to(astrologers[astrologerId].socketId).emit("videoCallRequestReceived", {
            videoCallRequestId: videoCallRequest._id,
            userId,
            userName: user.name || "Unknown",
            createdAt: videoCallRequest.createdAt,
          });
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

          const videoCallRequest = await ChatRequest.findById(videoCallRequestId).populate("user");
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
              io.to(users[videoCallRequest.user._id].socketId).emit("walletUpdate", {
                balance: user.wallet.balance,
                lockedBalance: user.wallet.lockedBalance,
              });
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
            const userUid = parseInt(videoCallRequest.user._id.toString().slice(-6), 16);
            const astrologerUid = parseInt(astrologerId.toString().slice(-6), 16);
            const userToken = generateAgoraToken(channelName, userUid);
            const astrologerToken = generateAgoraToken(channelName, astrologerUid);

            const timer = setInterval(async () => {
              try {
                const session = await ChatSession.findById(videoCallSession._id);
                if (!session || session.status !== "active") {
                  clearInterval(timer);
                  delete videoCallTimers[videoCallSession._id.toString()];
                  return;
                }

                const currentUser = await User.findById(videoCallRequest.user._id);
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
                    description: `Video call with ${astrologer.name} for ${duration} minute${duration > 1 ? "s" : ""}`,
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
                      io.to(users[videoCallRequest.user._id].socketId).emit("walletUpdate", {
                        balance: currentUser.wallet.balance,
                        lockedBalance: currentUser.wallet.lockedBalance,
                      });
                    }
                  }

                  if (users[videoCallRequest.user._id]?.socketId) {
                    io.to(users[videoCallRequest.user._id].socketId).emit("videoCallSessionEnded", {
                      videoCallSessionId: videoCallSession._id,
                      reason: "Insufficient balance",
                    });
                  }
                  if (astrologers[astrologerId]?.socketId) {
                    io.to(astrologers[astrologerId].socketId).emit("videoCallSessionEnded", {
                      videoCallSessionId: videoCallSession._id,
                      reason: "Insufficient balance",
                    });
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
                  io.to(users[videoCallRequest.user._id].socketId).emit("walletUpdate", {
                    balance: currentUser.wallet.balance,
                    lockedBalance: currentUser.wallet.lockedBalance,
                  });
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

            if (users[videoCallRequest.user._id]?.socketId) {
              io.to(users[videoCallRequest.user._id].socketId).emit("videoCallRequestAccepted", {
                videoCallSessionId: videoCallSession._id,
                astrologerId,
                astrologerName: astrologer.name,
                channelName,
                token: userToken,
                uid: userUid,
              });
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
              io.to(users[videoCallRequest.user._id].socketId).emit("videoCallRequestRejected", {
                videoCallRequestId,
                astrologerId,
              });
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

    socket.on("endVideoCallSession", async ({ videoCallSessionId, userId, userType }) => {
      try {
        const videoCallSession = await ChatSession.findById(videoCallSessionId).populate("user astrologer");
        if (!videoCallSession || videoCallSession.status !== "active") {
          throw new AppError("Invalid or inactive video call session", 400);
        }

        if (
          (userType === "user" && videoCallSession.user._id.toString() !== userId) ||
          (userType === "astrologer" && videoCallSession.astrologer._id.toString() !== userId)
        ) {
          throw new AppError("Unauthorized", 403);
        }

        videoCallSession.status = "ended";
        videoCallSession.endedAt = new Date();
        await videoCallSession.save();

        const astrologer = await Astrologer.findById(videoCallSession.astrologer._id);
        const user = await User.findById(videoCallSession.user._id);

        const duration = Math.ceil(
          (videoCallSession.endedAt - videoCallSession.startedAt) / 1000 / 60
        );
        const totalAmount = astrologer.pricing.video * duration;

        const transaction = await Transaction.create({
          amount: totalAmount,
          user: videoCallSession.user._id,
          astrologer: videoCallSession.astrologer._id,
          description: `Video call with ${astrologer.name} for ${duration} minute${duration > 1 ? "s" : ""}`,
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
            io.to(users[videoCallSession.user._id].socketId).emit("walletUpdate", {
              balance: user.wallet.balance,
              lockedBalance: user.wallet.lockedBalance,
            });
          }
        }

        astrologer.isBusy = false;
        await astrologer.save();

        if (users[videoCallSession.user._id]?.socketId) {
          io.to(users[videoCallSession.user._id].socketId).emit("videoCallSessionEnded", {
            videoCallSessionId,
            reason: "Session ended by user",
          });
        }
        if (astrologers[videoCallSession.astrologer._id]?.socketId) {
          io.to(astrologers[videoCallSession.astrologer._id].socketId).emit("videoCallSessionEnded", {
            videoCallSessionId,
            reason: "Session ended by user",
          });
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
    });
  });
};

module.exports = { setupVideoCallSocket };