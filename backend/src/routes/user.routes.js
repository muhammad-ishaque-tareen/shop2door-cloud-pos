const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { updateProfile } = require("../controllers/user.controller");

router.put("/update-profile", auth, updateProfile);

module.exports = router;