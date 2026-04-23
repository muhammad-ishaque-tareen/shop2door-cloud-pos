const bcrypt = require('bcrypt');
const masterPool = require('../db/master.pool');

// GET ALL USERS (across all stores of this shop)
exports.getUsers = async (req, res) => {
  try {
    const result = await req.shopDB.query(
      `SELECT
         u.user_id,
         u.name,
         u.email,
         u.phone,
         u.role,
         u.store_id,
         u.image_url,
         u.created_at,
         s.name AS store_name
       FROM users u
       LEFT JOIN stores s ON s.store_id = u.store_id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[SHOPUSERS] getUsers error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.shopDB.query(
      `SELECT u.*, s.name AS store_name
       FROM users u
       LEFT JOIN stores s ON s.store_id = u.store_id
       WHERE u.user_id = $1`,
      [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[SHOPUSERS] getUserById error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// CREATE USER (with limit check)
exports.createUser = async (req, res) => {
  const { name, email, phone, password, role, store_id, image_url } = req.body;
  const shop_id = req.user.shop_id;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Name is required.' });
  if (!email || !email.trim())
    return res.status(400).json({ message: 'Email is required.' });
  if (!password || password.length < 4)
    return res.status(400).json({ message: 'Password must be at least 4 characters.' });
  if (!role)
    return res.status(400).json({ message: 'Role is required.' });

  try {
    // LIMIT CHECK
    const limitCheck = await masterPool.query(
      `SELECT
         u.users_used,
         p.max_users_per_store
       FROM usage u
       JOIN shops s ON s.shop_id = u.shop_id
       JOIN packages p ON p.package_id = s.package_id
       WHERE u.shop_id = $1`,
      [shop_id]
    );

    if (!limitCheck.rows.length) {
      return res.status(400).json({ message: 'Usage record not found for this shop.' });
    }

    const { users_used, max_users_per_store } = limitCheck.rows[0];

    if (users_used >= max_users_per_store) {
      return res.status(403).json({
        message: `User limit reached. Your plan allows a maximum of ${max_users_per_store} user(s). You have already created ${users_used}. Please upgrade your package to add more users.`,
        users_used,
        max_users_per_store,
        limitReached: true
      });
    }

    // Check duplicate email
    const emailCheck = await req.shopDB.query(
      `SELECT user_id FROM users WHERE email = $1`, [email.trim()]
    );
    if (emailCheck.rows.length) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into ShopDB
    const result = await req.shopDB.query(
      `INSERT INTO users (name, email, phone, password, role, store_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, name, email, phone, role, store_id, image_url, created_at`,
      [
        name.trim(),
        email.trim(),
        phone || null,
        hashedPassword,
        role,
        store_id || null,
        image_url || null
      ]
    );

    // Increment usage in PlatformDB
    await masterPool.query(
      `UPDATE usage
       SET users_used = users_used + 1, updated_at = NOW()
       WHERE shop_id = $1`,
      [shop_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('[SHOPUSERS] createUser error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, store_id } = req.body;

  if (!role)
    return res.status(400).json({ message: 'Role is required.' });

  try {
    const result = await req.shopDB.query(
      `UPDATE users
       SET role = $1, store_id = $2
       WHERE user_id = $3
       RETURNING user_id, name, email, phone, role, store_id, image_url, created_at`,
      [role, store_id || null, id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: 'User not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[SHOPUSERS] updateUser error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const shop_id = req.user.shop_id;

  try {
    const result = await req.shopDB.query(
      `DELETE FROM users WHERE user_id = $1 RETURNING user_id`, [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'User not found' });

    // Decrement usage in PlatformDB
    await masterPool.query(
      `UPDATE usage
       SET users_used = GREATEST(users_used - 1, 0), updated_at = NOW()
       WHERE shop_id = $1`,
      [shop_id]
    );

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('[SHOPUSERS] deleteUser error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};