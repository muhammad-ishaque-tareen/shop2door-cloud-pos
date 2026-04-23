const getShopPool = require("../db/shop.pool");
module.exports = async (req, res, next) => {
  try {
    const db_name = req.user?.db_name;

    if (!db_name) {
      return res.status(403).json({ message: "No shop database associated with this account." });
    }

    req.shopDB = getShopPool(db_name);
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};