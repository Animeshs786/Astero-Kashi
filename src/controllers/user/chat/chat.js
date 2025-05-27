const ChatRequest = require("../../../models/chatRequest");
const ChatSession = require("../../../models/chatSession");
const Message = require("../../../models/message");
const catchAsync = require("../../../utils/catchAsync");

exports.getChatRequests = catchAsync(async (req, res, next) => {
  const user = req.user._id; // Assume astrologer ID from auth middleware
  const chatRequests = await ChatRequest.find({ user: user })
    .populate("user", "name profileImage")
    .sort({ createdAt: -1 });
  res.status(200).json({
    status: true,
    message: "Chat requests fetched successfully",
    data: chatRequests,
  });
});

exports.getChatSession = catchAsync(async (req, res, next) => {
  const user = req.user._id; // Assume astrologer ID from auth middleware
  const chatRequests = await ChatSession.find({ user: user })
    .populate("user", "name ")
    .sort({ createdAt: -1 });
  res.status(200).json({
    status: true,
    message: "Chat session fetched successfully",
    data: chatRequests,
  });
});

exports.getSessionMessage = catchAsync(async (req, res, next) => {
  const userId = req.user._id; // From protect middleware
  const chatSessionId = req.params.id;

  // Fetch messages for the chat session, excluding deleted messages
  const messages = await Message.find({
    chatSession: chatSessionId,
    $or: [
      // Messages where user is sender and not deleted for sender
      {
        sender: userId,
        deletedForSender: false,
        deletedForEveryone: false,
      },
      // Messages where user is recipient and not deleted for recipient
      {
        recipient: userId,
        deletedForRecipient: false,
        deletedForEveryone: false,
      },
    ],
  })
    .populate("sender", "name profileImage")
    .populate("recipient", "name profileImage")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    status: true,
    message: "Chat messages fetched successfully",
    data: messages,
  });
});

exports.setNotRespond = catchAsync(async (req, res, next) => {
 const userId = req.user._id; // From protect middleware// Assume astrologer ID from auth middleware
  const chatRequestId = req.params.id; // Chat request ID from URL params

  // Find and update the chat request
  const chatRequest = await ChatRequest.findOne({
    _id: chatRequestId,
    status: "pending",
  });

  console.log(userId, chatRequestId, "log");

  if (!chatRequest) {
    return res.status(404).json({
      status: false,
      message: "Chat request not found or not in pending status",
    });
  }
  chatRequest.status = "notRespond";
  chatRequest.respondedAt = Date.now();
  await chatRequest.save();

  res.status(200).json({
    status: true,
    message: "Chat request marked as not responded",
    data: chatRequest,
  });
});
