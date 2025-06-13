const express = require("express");
const bodyParser = require("body-parser");
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
const {
  getAllAstrologers,
  getAstrologer,
} = require("../controllers/user/asterologer/asterologer");
const {
  getAllRechargePlans,
} = require("../controllers/user/rechargePlan/rechargePlan");
const {
  rechargeWallet,
  getWalletBalance,
  walletWebhook,
} = require("../controllers/user/wallet/wallet");
const {
  getTransactionHistory,
} = require("../controllers/user/transaction/transaction");
const {
  getChatRequests,
  getSessionMessage,
  setNotRespond,
} = require("../controllers/user/chat/chat");
const { getChatSession } = require("../controllers/user/chat/chat");
const { getAllBanners } = require("../controllers/user/banner/banner");
const {
  getAllCategories,
} = require("../controllers/user/productCategory/productCategory");
const {
  getAllProducts,
  getProduct,
} = require("../controllers/user/product/product");
const {
  createShipping,
  getAllShippings,
  getShipping,
  updateShipping,
  deleteShipping,
} = require("../controllers/user/shipping.js/shipping");
const {
  createProductTransaction,
  getAllProductTransactions,
  getProductTransaction,
  transactionWebhook,
} = require("../controllers/user/productTransaction/productTransaction");
const {
  createPoojaTransaction,
  getAllPoojaTransactions,
  getPoojaTransaction,
} = require("../controllers/user/poojaTransaction/poojaTransaction");
const {
  getDailyHoroscope,
  getKundliDetails,
  matchKundli,
  getTomorrowHoroscope,
  getYesterdayHoroscope,
  getMonthlyHoroscope,
} = require("../controllers/user/horoscope/horoscope");
const { getAllPoojas, getPooja } = require("../controllers/user/pooja/pooja");
const { getCompatibility } = require("../controllers/user/compatibility/compatibility");
const { getAstrologersByPooja } = require("../controllers/admin/pooja/pooja");

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
router.get("/rechargePlan", getAllRechargePlans);

//wallet
router.post("/wallet", userAuthenticate, rechargeWallet);
router.post(
  "/walletWebhook",
  bodyParser.raw({ type: "application/json" }),
  walletWebhook
);
router.get("/wallet", userAuthenticate, getWalletBalance);

//transaction
router.get("/transaction", userAuthenticate, getTransactionHistory);

//chat
router.get("/chatRequest", userAuthenticate, getChatRequests);
router.get("/chatSession", userAuthenticate, getChatSession);
router.get("/sessionMessage/:id", userAuthenticate, getSessionMessage);
router.get("/notRespond/:id", userAuthenticate, setNotRespond);

//banner
router.get("/banner", getAllBanners);

//product category
router.get("/category", getAllCategories);

//product
router.get("/product", getAllProducts);
router.get("/product/:id", getProduct);

//shipping
router
  .route("/shipping")
  .post(userAuthenticate, createShipping)
  .get(userAuthenticate, getAllShippings);

router
  .route("/shipping/:id")
  .get(userAuthenticate, getShipping)
  .patch(userAuthenticate, updateShipping)
  .delete(userAuthenticate, deleteShipping);

//product trans action
router
  .route("/productTransaction")
  .post(userAuthenticate, createProductTransaction)
  .get(userAuthenticate, getAllProductTransactions);
router
  .route("/productTransaction/:id")
  .get(userAuthenticate, getProductTransaction);
router.post(
  "/transactionWebhook",
  bodyParser.raw({ type: "application/json" }),
  transactionWebhook
);

//pooja transaction

//product trans action
router
  .route("/poojaTransaction")
  .post(userAuthenticate, createPoojaTransaction)
  .get(userAuthenticate, getAllPoojaTransactions);
router
  .route("/poojaTransaction/:id")
  .get(userAuthenticate, getPoojaTransaction);
router.post(
  "/poojaTransactionWebhook",
  bodyParser.raw({ type: "application/json" }),
  transactionWebhook
);

//horoscope
router.post("/dailyHoroscope", getDailyHoroscope);
router.post("/tomorrowHoroscope", getTomorrowHoroscope);
router.post("/yesterdayHoroscope", getYesterdayHoroscope);
router.post("/monthlyHoroscope", getMonthlyHoroscope);
router.post("/kundli", getKundliDetails);
router.post("/matchKundli", matchKundli);

//pooja
router.route("/pooja").get(getAllPoojas);
router.route("/pooja/:id").get(getPooja);
router.get("/poojaAstrologer/:id", getAstrologersByPooja);

//compatibility
router.get("/compatibility/:id", getCompatibility);

module.exports = router;
