const masterPool = require('../db/master.pool');

// GET ALL STORES (with today's sales, orders, staff count)
exports.getStores = async (req, res) => {
  try {
    const result = await req.shopDB.query(
      `SELECT
         s.store_id,
         s.name,
         s.address,
         s.phone,
         s.is_active,
         s.created_at,

         -- Staff count (store_manager + cashier roles assigned to this store)
         COUNT(DISTINCT u.user_id)                        AS staff_count,

         -- Today's total sales amount
         COALESCE(SUM(sa.total) FILTER (
           WHERE sa.created_at::date = CURRENT_DATE
         ), 0)                                            AS todays_sales,

         -- Today's order/sale count
         COUNT(DISTINCT sa.sale_id) FILTER (
           WHERE sa.created_at::date = CURRENT_DATE
         )                                                AS todays_orders

       FROM stores s
       LEFT JOIN users  u  ON u.store_id  = s.store_id
       LEFT JOIN sales  sa ON sa.store_id = s.store_id
       GROUP BY s.store_id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[STORE] getStores error:', error.message);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// GET STORE BY ID (with today's sales, orders, staff count)
exports.getStoreById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.shopDB.query(
      `SELECT
         s.store_id,
         s.name,
         s.address,
         s.phone,
         s.is_active,
         s.created_at,

         COUNT(DISTINCT u.user_id)                        AS staff_count,

         COALESCE(SUM(sa.total) FILTER (
           WHERE sa.created_at::date = CURRENT_DATE
         ), 0)                                            AS todays_sales,

         COUNT(DISTINCT sa.sale_id) FILTER (
           WHERE sa.created_at::date = CURRENT_DATE
         )                                                AS todays_orders

       FROM stores s
       LEFT JOIN users  u  ON u.store_id  = s.store_id
       LEFT JOIN sales  sa ON sa.store_id = s.store_id
       WHERE s.store_id = $1
       GROUP BY s.store_id`,
      [id]
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
    //  LIMIT CHECK 
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
    // 

    const result = await req.shopDB.query(
      `INSERT INTO stores (name, address, phone, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), address || null, phone || null, is_active !== false]
    );

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