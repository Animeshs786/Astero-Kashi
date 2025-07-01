const express = require("express");
const {
  otpVerify,
} = require("../controllers/asterologer/authController/otpVerify");
const { signUp } = require("../controllers/asterologer/authController/signUp");
const {
  getProfile,
} = require("../controllers/asterologer/authController/getProfile");
const {
  asterologerAuthenticate,
} = require("../controllers/asterologer/authController/userAuthenticate");

const fileUploader = require("../middleware/fileUploader");
const {
  updateProfile,
} = require("../controllers/asterologer/authController/updateProfile");
const {
  getChatRequests,
  getChatSession,
  getSessionMessage,
} = require("../controllers/asterologer/chat/chat");
const { userNotifyList, notifyToUser } = require("../controllers/asterologer/notify/notify");
const { getDailyHoroscope, getTomorrowHoroscope, getYesterdayHoroscope, getMonthlyHoroscope, getKundliDetails, matchKundli, getPanchangDetails } = require("../controllers/user/horoscope/horoscope");
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
      { name: "adharFrontImage", maxCount: 1 },
      { name: "adharBackImage", maxCount: 1 },
      { name: "panImage", maxCount: 1 },
      { name: "bankPassbookImage", maxCount: 1 },
      { name: "cancelChecqueImage", maxCount: 1 },
    ],
    "Astrologer"
  ),
  updateProfile
);

//chat
router.get("/chatRequest", asterologerAuthenticate, getChatRequests);
router.get("/chatSession", asterologerAuthenticate, getChatSession);
router.get("/sessionMessage/:id", asterologerAuthenticate, getSessionMessage);

//notify
router.get("/userNotifyList", asterologerAuthenticate, userNotifyList);
router.post("/userNotifyList", asterologerAuthenticate, notifyToUser);

//horoscope
router.post("/dailyHoroscope", getDailyHoroscope);
router.post("/tomorrowHoroscope", getTomorrowHoroscope);
router.post("/yesterdayHoroscope", getYesterdayHoroscope);
router.post("/monthlyHoroscope", getMonthlyHoroscope);
router.post("/kundli", getKundliDetails);
router.post("/matchKundli", matchKundli);
router.post("/panchang", getPanchangDetails);
module.exports = router;
