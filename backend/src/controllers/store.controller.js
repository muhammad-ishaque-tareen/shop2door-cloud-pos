// const masterPool = require('../db/master.pool');

// //  GET ALL STORES 
// exports.getStores = async (req, res) => {
//   try {
//     const result = await req.shopDB.query(
//       `SELECT
//          store_id,
//          name,
//          address,
//          phone,
//          is_active,
//          created_at
//        FROM stores
//        ORDER BY created_at DESC`
//     );
//     res.json(result.rows);
//   } catch (error) {
//     console.error('[STORE] getStores error:', error.message);
//     res.status(500).json({ message: 'Server error', detail: error.message });
//   }
// };

// //GET STORE BY ID 
// exports.getStoreById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const result = await req.shopDB.query(
//       `SELECT * FROM stores WHERE store_id = $1`, [id]
//     );
//     if (!result.rows.length)
//       return res.status(404).json({ message: 'Store not found' });
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('[STORE] getStoreById error:', error.message);
//     res.status(500).json({ message: 'Server error', detail: error.message });
//   }
// };

// //  CREATE STORE 
// exports.createStore = async (req, res) => {
//   const { name, address, phone, is_active } = req.body;

//   if (!name || !name.trim())
//     return res.status(400).json({ message: 'Store name is required.' });

//   try {
//     const result = await req.shopDB.query(
//       `INSERT INTO stores (name, address, phone, is_active)
//        VALUES ($1, $2, $3, $4)
//        RETURNING *`,
//       [name.trim(), address || null, phone || null, is_active !== false]
//     );

//     // Increment usage counter in PlatformDB
//     await masterPool.query(
//       `UPDATE usage
//        SET stores_used = stores_used + 1, updated_at = NOW()
//        WHERE shop_id = $1`,
//       [req.user.shop_id]
//     );
//     res.status(201).json(result.rows[0]);

//   } catch (error) {
//     console.error('[STORE] createStore error:', error.message);
//     res.status(500).json({ message: 'Server error', detail: error.message });
//   }
// };

// // UPDATE STORE
// exports.updateStore = async (req, res) => {
//   const { id } = req.params;
//   const { name, address, phone, is_active } = req.body;

//   if (!name || !name.trim())
//     return res.status(400).json({ message: 'Store name is required.' });

//   try {
//     const result = await req.shopDB.query(
//       `UPDATE stores
//        SET name = $1, address = $2, phone = $3, is_active = $4
//        WHERE store_id = $5
//        RETURNING *`,
//       [name.trim(), address || null, phone || null, is_active, id]
//     );

//     if (!result.rows.length)
//       return res.status(404).json({ message: 'Store not found' });
//     res.json(result.rows[0]);

//   } catch (error) {
//     console.error('[STORE] updateStore error:', error.message);
//     res.status(500).json({ message: 'Server error', detail: error.message });
//   }
// };



const masterPool = require('../db/master.pool');

//  GET ALL STORES
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

// GET STORE BY ID
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

// CREATE STORE
exports.createStore = async (req, res) => {
  const { name, address, phone, is_active } = req.body;
  const shop_id = req.user.shop_id;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Store name is required.' });

  try {
    // ── LIMIT CHECK ──────────────────────────────────────────────
    // Fetch current usage and the package limit from PlatformDB
    const limitCheck = await masterPool.query(
      `SELECT
         u.stores_used,
         p.max_stores
       FROM usage u
       JOIN shops s ON s.shop_id = u.shop_id
       JOIN packages p ON p.package_id = s.package_id
       WHERE u.shop_id = $1`,
      [shop_id]
    );

    if (!limitCheck.rows.length) {
      return res.status(400).json({ message: 'Usage record not found for this shop.' });
    }

    const { stores_used, max_stores } = limitCheck.rows[0];

    if (stores_used >= max_stores) {
      return res.status(403).json({
        message: `Store limit reached. Your plan allows a maximum of ${max_stores} store(s). You have already created ${stores_used}. Please upgrade your package to add more stores.`,
        stores_used,
        max_stores,
        limitReached: true
      });
    }
    // ─────────────────────────────────────────────────────────────

    // Insert into ShopDB
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
      [shop_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('[STORE] createStore error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// UPDATE STORE
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