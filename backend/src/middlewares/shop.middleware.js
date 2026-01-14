const masterPool = require("../db/master.pool");
const getShopPool = require("../db/shop.pool");

module.exports = async (req, res, next) => {
  try {
    const userResult = await masterPool.query(
      `SELECT s.db_name 
       FROM users u
       JOIN shops s ON u.shop_id = s.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0)
      return res.status(403).json({ message: "Shop not found" });
    req.shopDB = getShopPool(userResult.rows[0].db_name);
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
