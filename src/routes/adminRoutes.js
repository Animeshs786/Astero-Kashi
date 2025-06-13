const express = require("express");

const { register } = require("../controllers/admin/authController/register");
const { login } = require("../controllers/admin/authController/login");
const {
  adminAuthenticate,
} = require("../controllers/admin/authController/adminAuthenticate");
const fileUploader = require("../middleware/fileUploader");
const {
  createBanner,
  getAllBanners,
  getBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/admin/banner/banner");
const {
  createBlog,
  getAllBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
} = require("../controllers/admin/blog/blog");
const {
  createAstrologer,
  getAllAstrologers,
  getAstrologer,
  updateAstrologer,
  deleteAstrologer,
} = require("../controllers/admin/asterologer/asterologer");
const {
  createSpeciality,
  getAllSpecialities,
  getSpeciality,
  updateSpeciality,
  deleteSpeciality,
} = require("../controllers/admin/speciality/speciality");
const { profile } = require("../controllers/admin/authController/profile");
const {
  updatePassword,
} = require("../controllers/admin/authController/updatePassword");
const {
  updateAdminProfile,
} = require("../controllers/admin/authController/updateProfile");
const { createRole } = require("../controllers/admin/role/createRole");
const { getAllRoles } = require("../controllers/admin/role/getAllRole");
const { getRoleById } = require("../controllers/admin/role/getRole");
const { updateRole } = require("../controllers/admin/role/updateRole");
const { deleteRole } = require("../controllers/admin/role/deleteRole");
const {
  getAllMember,
} = require("../controllers/admin/authController/getAllMember");
const {
  createRechargePlan,
  getAllRechargePlans,
  getRechargePlan,
  updateRechargePlan,
  deleteRechargePlan,
} = require("../controllers/admin/rechargePlan/rechargePlan");
const {
  getTransactionHistory,
  getTransation,
} = require("../controllers/admin/transaction/transaction");
const {
  createImage,
  getAllImages,
  updateImage,
  getImage,
  deleteImage,
} = require("../controllers/admin/imageUploader/imageUploader");
const {
  createSettlement,
  getAllSettlements,
  getSettlementDetail,
  completeSettlement,
} = require("../controllers/admin/settlement/settlement");
const {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/admin/productCategory/productCategory");
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/admin/product/product");
const {
  getAllProductTransactions,
  getProductTransaction,
  updateProductTransaction,
} = require("../controllers/admin/productTransaction/productTransaction");
const {
  createPooja,
  getAllPoojas,
  getPooja,
  updatePooja,
  deletePooja,
  createAssignAstrologer,
  deleteAssignAstrologer,
  getAstrologersByPooja,
} = require("../controllers/admin/pooja/pooja");
const {
  getAllPoojaTransactions,
  getPoojaTransaction,
  updatePoojaTransaction,
} = require("../controllers/admin/poojaTransaction/poojaTransaction");
const {
  createCompatibilityData,
  getAllCompatibilityData,
  getCompatibilityData,
  updateCompatibilityData,
  deleteCompatibilityData,
} = require("../controllers/admin/compatibility/compatibility");

const router = express.Router();

//Authentication
router.post(
  "/register",
  fileUploader([{ name: "profileImage", maxCount: 1 }], "admin"),
  register
);
router.post("/login", login);

router.use(adminAuthenticate);

router.get("/profile", profile);
router.patch(
  "/profile",
  fileUploader([{ name: "profileImage", maxCount: 1 }], "admin"),
  updateAdminProfile
);
router.patch("/passwordUpdate", updatePassword);
router.get("/member", getAllMember);

//Banner
router
  .route("/banner")
  .post(fileUploader([{ name: "image", maxCount: 1 }], "Banner"), createBanner)
  .get(getAllBanners);
router
  .route("/banner/:id")
  .get(getBanner)
  .patch(fileUploader([{ name: "image", maxCount: 1 }], "Banner"), updateBanner)
  .delete(deleteBanner);

//blog
router
  .route("/blog")
  .post(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "image", maxCount: 10 },
      ],
      "Blog"
    ),
    createBlog
  )
  .get(getAllBlogs);

router
  .route("/blog/:id")
  .get(getBlog)
  .patch(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "image", maxCount: 10 },
      ],
      "Blog"
    ),
    updateBlog
  )
  .delete(deleteBlog);

//astorloger
router
  .route("/astrologer")
  .post(
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
    createAstrologer
  )
  .get(getAllAstrologers);

router
  .route("/astrologer/:id")
  .get(getAstrologer)
  .patch(
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
    updateAstrologer
  )
  .delete(deleteAstrologer);

//specialty
router.route("/speciality").post(createSpeciality).get(getAllSpecialities);

router
  .route("/speciality/:id")
  .get(getSpeciality)
  .patch(updateSpeciality)
  .delete(deleteSpeciality);

//role
router.route("/role").post(createRole).get(getAllRoles);
router.route("/role/:id").get(getRoleById).patch(updateRole).delete(deleteRole);

//rechargePlan
router.route("/rechargePlan").post(createRechargePlan).get(getAllRechargePlans);

router
  .route("/rechargePlan/:id")
  .get(getRechargePlan)
  .patch(updateRechargePlan)
  .delete(deleteRechargePlan);

//transaction
router.get("/transaction", getTransactionHistory);
router.get("/transaction/:id", getTransation);

//image uploader
router
  .route("/image")
  .post(
    fileUploader([{ name: "image", maxCount: 1 }], "imageBulk"),
    createImage
  )
  .get(getAllImages);

router
  .route("/image/:id")
  .patch(
    fileUploader([{ name: "image", maxCount: 1 }], "imageBulk"),
    updateImage
  )
  .get(getImage)
  .delete(deleteImage);

//settlement
router.route("/settlement").post(createSettlement).get(getAllSettlements);
router
  .route("/settlement/:id")
  .get(getSettlementDetail)
  .patch(
    fileUploader([{ name: "receiptImage", maxCount: 1 }], "Settlement"),
    completeSettlement
  );

//product category
router
  .route("/category")
  .post(
    fileUploader([{ name: "image", maxCount: 1 }], "Category"),
    createCategory
  )
  .get(getAllCategories);

router
  .route("/category/:id")
  .get(getCategory)
  .patch(
    fileUploader([{ name: "image", maxCount: 1 }], "Category"),
    updateCategory
  )
  .delete(deleteCategory);

//product
router
  .route("/product")
  .post(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "image", maxCount: 10 }, // Adjust maxCount as needed
      ],
      "Product"
    ),
    createProduct
  )
  .get(getAllProducts);

router
  .route("/product/:id")
  .get(getProduct)
  .patch(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "image", maxCount: 10 }, // Adjust maxCount as needed
      ],
      "Product"
    ),
    updateProduct
  )
  .delete(deleteProduct);

//product transactjion
router.get("/productTransaction", getAllProductTransactions);
router.get("/productTransaction/:id", getProductTransaction);
router.patch("/productTransaction/:id", updateProductTransaction);

//pooja transactjion
router.get("/poojaTransaction", getAllPoojaTransactions);
router.get("/poojaTransaction/:id", getPoojaTransaction);
router.patch("/poojaTransaction/:id", updatePoojaTransaction);

//pooja
router
  .route("/pooja")
  .post(fileUploader([{ name: "image", maxCount: 1 }], "Pooja"), createPooja)
  .get(getAllPoojas);

router
  .route("/pooja/:id")
  .get(getPooja)
  .patch(fileUploader([{ name: "image", maxCount: 1 }], "Pooja"), updatePooja)
  .delete(deletePooja);

router.post("/assignAstrologer", createAssignAstrologer);
router.delete("/assignAstrologer/:id", deleteAssignAstrologer);
router.get("/poojaAstrologer/:id", getAstrologersByPooja);

//compatibility
router
  .route("/compatibility")
  .post(createCompatibilityData)
  .get(getAllCompatibilityData);
router
  .route("/compatibility/:id")
  .get(getCompatibilityData)
  .patch(updateCompatibilityData)
  .delete(deleteCompatibilityData);

module.exports = router;
