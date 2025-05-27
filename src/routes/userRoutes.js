const express = require("express");
const { signUp } = require("../controllers/user/authController/signUp");
const { otpVerify } = require("../controllers/user/authController/otpVerify");
const {
  userAuthenticate,
} = require("../controllers/user/authController/userAuthenticate");
const { getProfile } = require("../controllers/user/authController/getProfile");
const {
  updateProfile,
} = require("../controllers/user/authController/updateProfile");
const { getAllBlogs, getBlog } = require("../controllers/user/blog/blog");
const {
  getAllSpecialities,
  getSpeciality,
} = require("../controllers/user/speciality/speciality");
const fileUploader = require("../middleware/fileUploader");
const { getAllAstrologers, getAstrologer } = require("../controllers/user/asterologer/asterologer");
const { getAllRechargePlans } = require("../controllers/user/rechargePlan/rechargePlan");
const { rechargeWallet, getWalletBalance } = require("../controllers/user/wallet/wallet");
const { getTransactionHistory } = require("../controllers/user/transaction/transaction");
const { getChatRequests, getSessionMessage, setNotRespond } = require("../controllers/user/chat/chat");
const { getChatSession } = require("../controllers/user/chat/chat");
const { getAllBanners } = require("../controllers/user/banner/banner");

const router = express.Router();

//Authentication
router.post("/signUp", signUp);
router.post("/verifyOtp", otpVerify);

router.get("/profile", userAuthenticate, getProfile);
router.patch(
  "/profile",
  userAuthenticate,
  fileUploader([{ name: "profileImage", maxCount: 1 }], "User"),
  updateProfile
);

//blog
router.get("/blog", getAllBlogs);
router.get("/blog/:id", getBlog);

//speciality
router.get("/speciality", getAllSpecialities);
router.get("/speciality/:id", getSpeciality);



//asterologer
router.get("/asterologer", getAllAstrologers);
router.get("/asterologer/:id", getAstrologer);

//recahreg plan
router.get("/rechargePlan",getAllRechargePlans)


//wallet
router.post("/wallet", userAuthenticate, rechargeWallet)
router.get("/wallet", userAuthenticate, getWalletBalance)


  //transaction
  router.get("/transaction",userAuthenticate,getTransactionHistory);

  
  //chat
  router.get("/chatRequest", userAuthenticate, getChatRequests);
  router.get("/chatSession", userAuthenticate, getChatSession);
  router.get("/sessionMessage/:id", userAuthenticate, getSessionMessage);
  router.get("/notRespond/:id", userAuthenticate, setNotRespond);

  //banner
  router.get("/banner",getAllBanners)

module.exports = router;
