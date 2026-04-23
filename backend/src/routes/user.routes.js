const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const { uploadProfileImage, updateProfile } = require("../controllers/user.controller");

// PUT /api/users/update-profile
// Content-Type: multipart/form-data
// Fields: name, phone, password (all optional)
// File:   image (optional, field name "image")
router.put("/update-profile", auth, uploadProfileImage, updateProfile);

module.exports = router;