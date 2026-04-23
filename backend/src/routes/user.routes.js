const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const {
  uploadProfileImage,
  updateProfile,
  getMyProfile,
} = require("../controllers/user.controller");
router.get("/me", auth, getMyProfile);

router.put("/update-profile", auth, uploadProfileImage, updateProfile);

module.exports = router;