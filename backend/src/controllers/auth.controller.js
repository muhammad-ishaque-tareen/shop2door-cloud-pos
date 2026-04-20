const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const masterPool = require("../db/master.pool");

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Step 1: Login attempt for:', email);

    const result = await masterPool.query(
      `SELECT u.user_id,
              u.name,
              u.email,
              u.phone,
              u.password,
              u.role,
              u.shop_id,
              u.image_url,
              s.name as shop_name,
              s.db_name,
              s.logo_url as shop_logo,
              s.address as shop_address,
              s.phone as shop_phone,
              s.opening_hours as shop_hours
       FROM users u
       JOIN shops s ON u.shop_id = s.shop_id
       WHERE u.email = $1`,
      [email]
    );

    console.log('Step 2: Rows found:', result.rows.length);

    if (!result.rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result.rows[0];
    console.log('Step 3: User found:', user.name, '| user_id:', user.user_id);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Step 4: Password match:', isMatch);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials, password does not match!" });

    const token = jwt.sign(
      { id: user.user_id, shop_id: user.shop_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log('Step 5: Login success!');

    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shop_id: user.shop_id,
        shop_name: user.shop_name,
        shop_logo: user.shop_logo,
        shop_address: user.shop_address,
        shop_phone: user.shop_phone,
        shop_hours: user.shop_hours,
        image_url: user.image_url,
        db_name: user.db_name
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};