const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const { uploadProfileImage, updateProfile } = require("../controllers/user.controller");
router.put("/update-profile", auth, uploadProfileImage, updateProfile);

module.exports = router;