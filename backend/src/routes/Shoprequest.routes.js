const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const {
  getShopRequests,
  approveShopRequest,
  rejectShopRequest,
} = require("../controllers/shoprequest.controller");

router.get("/",                auth, authorizeRoles("system_admin"), getShopRequests);
router.post("/:id/approve",    auth, authorizeRoles("system_admin"), approveShopRequest);
router.post("/:id/reject",     auth, authorizeRoles("system_admin"), rejectShopRequest);

module.exports = router;