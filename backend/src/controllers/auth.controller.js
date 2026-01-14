
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const masterPool = require("../db/master.pool");

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await masterPool.query(
      `SELECT u.*, s.name as shop_name, s.db_name 
       FROM users u
       JOIN shops s ON u.shop_id = s.id
       WHERE u.email = $1`,
      [email]
    );

    if (!result.rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result.rows[0];
        if (password !== user.password) {
          return res.status(401).json({ message: "Invalid credentials, password does not match!" });
          }
    const token = jwt.sign(
      { id: user.id, shop_id: user.shop_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shop_id: user.shop_id,
        shop_name: user.shop_name,
        image_url: user.image_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error" });
  }
};
