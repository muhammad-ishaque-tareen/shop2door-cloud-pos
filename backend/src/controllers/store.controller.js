// ─────────────────────────────────────────────────────────────────────────────
// store.controller.js  — aligned to ShopDB schema:
//   stores(store_id, name, address, phone, is_active, created_at)
//   users(user_id, name, email, role, store_id, ...)
// ─────────────────────────────────────────────────────────────────────────────
const masterPool = require('../db/master.pool');

// ── GET ALL STORES ────────────────────────────────────────────────────────────
exports.getStores = async (req, res) => {
  try {
    const result = await req.shopDB.query(
      `SELECT
         store_id,
         name,
         address,
         phone,
         is_active,
         created_at
       FROM stores
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[STORE] getStores error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// ── GET STORE BY ID ───────────────────────────────────────────────────────────
exports.getStoreById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.shopDB.query(
      `SELECT * FROM stores WHERE store_id = $1`, [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Store not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[STORE] getStoreById error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// ── CREATE STORE ──────────────────────────────────────────────────────────────
exports.createStore = async (req, res) => {
  const { name, address, phone, is_active } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Store name is required.' });

  try {
    const result = await req.shopDB.query(
      `INSERT INTO stores (name, address, phone, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), address || null, phone || null, is_active !== false]
    );

    // Increment usage counter in PlatformDB
    await masterPool.query(
      `UPDATE usage
       SET stores_used = stores_used + 1, updated_at = NOW()
       WHERE shop_id = $1`,
      [req.user.shop_id]
    );
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('[STORE] createStore error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// ── UPDATE STORE ──────────────────────────────────────────────────────────────
exports.updateStore = async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, is_active } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Store name is required.' });

  try {
    const result = await req.shopDB.query(
      `UPDATE stores
       SET name = $1, address = $2, phone = $3, is_active = $4
       WHERE store_id = $5
       RETURNING *`,
      [name.trim(), address || null, phone || null, is_active, id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: 'Store not found' });
    res.json(result.rows[0]);

  } catch (error) {
    console.error('[STORE] updateStore error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};