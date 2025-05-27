const express = require("express");
const { otpVerify } = require("../controllers/asterologer/authController/otpVerify");
const { signUp } = require("../controllers/asterologer/authController/signUp");
const { getProfile } = require("../controllers/asterologer/authController/getProfile");
const { asterologerAuthenticate } = require("../controllers/asterologer/authController/userAuthenticate");

const fileUploader = require("../middleware/fileUploader");
const { updateProfile } = require("../controllers/asterologer/authController/updateProfile");
const { getChatRequests, getChatSession, getSessionMessage } = require("../controllers/asterologer/chat/chat");
const router = express.Router();

//Authentication
router.post("/signUp", signUp);
router.post("/verifyOtp", otpVerify);

router.get("/profile", asterologerAuthenticate, getProfile);
router.patch(
  "/profile",
  asterologerAuthenticate,
  fileUploader(
    [
      { name: "profileImage", maxCount: 1 },
      { name: "documentImage", maxCount: 5 },
    ],
    "Astrologer"
  ),
  updateProfile
);

//chat
router.get("/chatRequest", asterologerAuthenticate, getChatRequests);
router.get("/chatSession", asterologerAuthenticate, getChatSession);
router.get("/sessionMessage/:id", asterologerAuthenticate, getSessionMessage);
module.exports = router;