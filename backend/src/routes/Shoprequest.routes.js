const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const {
  getShopRequests,
  approveShopRequest,
  rejectShopRequest,
} = require("../controllers/shoprequest.controller");

router.get("/",                auth, getShopRequests);
router.post("/:id/approve",    auth, approveShopRequest);
router.post("/:id/reject",     auth, rejectShopRequest);

module.exports = router;