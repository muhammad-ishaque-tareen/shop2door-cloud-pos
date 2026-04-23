const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const { getStats, getPackages } = require("../controllers/system.controller");

router.get("/stats",    auth, getStats);
router.get("/packages", auth, getPackages);

module.exports = router;