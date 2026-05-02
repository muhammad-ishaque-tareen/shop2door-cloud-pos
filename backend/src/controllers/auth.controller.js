const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const masterPool = require("../db/master.pool");
const getShopPool = require("../db/shop.pool");

exports.login = async (req, res) => {
  const { email, password, shopCode } = req.body;

  try {
    //  PATH 1: system_admin / shop_admin (platformDB) 
    const platformResult = await masterPool.query(
      `SELECT u.user_id, u.name, u.email, u.phone, u.password, u.role,
              u.shop_id, u.image_url,
              s.name          AS shop_name,
              s.db_name,
              s.logo_url      AS shop_logo,
              s.address       AS shop_address,
              s.phone         AS shop_phone,
              s.opening_hours AS shop_hours
       FROM users u
       LEFT JOIN shops s ON u.shop_id = s.shop_id
       WHERE u.email = $1`,
      [email]
    );

    if (platformResult.rows.length > 0) {
      const user = platformResult.rows[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      // ✅ role is now included in the token
      const token = jwt.sign(
        {
          id:      user.user_id,
          role:    user.role,          // <── FIXED
          shop_id: user.shop_id,
          db_name: user.db_name || null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        token,
        user: {
          id:           user.user_id,
          name:         user.name,
          email:        user.email,
          phone:        user.phone,
          role:         user.role,
          shop_id:      user.shop_id,
          shop_name:    user.shop_name,
          shop_logo:    user.shop_logo,
          shop_address: user.shop_address,
          shop_phone:   user.shop_phone,
          shop_hours:   user.shop_hours,
          image_url:    user.image_url,
          db_name:      user.db_name,
        },
      });
    }

    //  PATH 2: store_manager / cashier (shopDB) 
    const codeProvided = shopCode && String(shopCode).trim() !== "";
    if (!codeProvided) {
      return res.status(401).json({
        message:
          "User not found. If you are a Cashier or Store Manager, please enter your Shop Code.",
      });
    }

    const normalizedCode = String(shopCode).trim().toUpperCase();

    const shopResult = await masterPool.query(
      `SELECT shop_id, db_name,
              name          AS shop_name,
              logo_url      AS shop_logo,
              address       AS shop_address,
              phone         AS shop_phone,
              opening_hours AS shop_hours
       FROM shops
       WHERE code = $1`,
      [normalizedCode]
    );

    if (shopResult.rows.length === 0)
      return res
        .status(401)
        .json({ message: "Invalid Shop Code. Please check and try again." });

    const shop = shopResult.rows[0];

    // Guard: db_name must exist
    if (!shop.db_name)
      return res
        .status(500)
        .json({ message: "Shop database not configured. Contact support." });

    const shopPool = getShopPool(shop.db_name);

    const shopUserResult = await shopPool.query(
      `SELECT user_id, name, email, phone, password, role, store_id, image_url
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (shopUserResult.rows.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const shopUser = shopUserResult.rows[0];

    const isMatch = await bcrypt.compare(password, shopUser.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    if (!["store_manager", "cashier"].includes(shopUser.role))
      return res
        .status(403)
        .json({ message: "Unauthorized role for this login path." });

    // ✅ role is now included in the token
    const token = jwt.sign(
      {
        id:       shopUser.user_id,
        role:     shopUser.role,        // <── FIXED
        shop_id:  shop.shop_id,
        store_id: shopUser.store_id,
        db_name:  shop.db_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id:           shopUser.user_id,
        name:         shopUser.name,
        email:        shopUser.email,
        phone:        shopUser.phone,
        role:         shopUser.role,
        store_id:     shopUser.store_id,
        shop_id:      shop.shop_id,
        shop_name:    shop.shop_name,
        shop_logo:    shop.shop_logo,
        shop_address: shop.shop_address,
        shop_phone:   shop.shop_phone,
        shop_hours:   shop.shop_hours,
        image_url:    shopUser.image_url,
        db_name:      shop.db_name,
      },
    });

  } catch (error) {
    console.error("[AUTH] Server error:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};