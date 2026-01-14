const bcrypt = require("bcrypt");
const masterPool = require("../db/master.pool");

exports.updateProfile = async (req, res) => {
  const { name, email, phone, password } = req.body;
  const userId = req.user.id;

  try {
    let query = `UPDATE users SET name = $1, email = $2, phone = $3`;
    let params = [name, email, phone];
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = $${params.length + 1}`;
      params.push(hashedPassword);
    }

    query += ` WHERE id = $${params.length + 1} RETURNING id, name, email, phone, role, shop_id`;
    params.push(userId);

    const result = await masterPool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};