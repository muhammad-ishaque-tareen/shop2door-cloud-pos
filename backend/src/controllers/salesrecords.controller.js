let _hasItemsCol = null; // null = unchecked, true/false after first check

const checkItemsColumn = async (db) => {
  if (_hasItemsCol !== null) return _hasItemsCol;
  try {
    const r = await db.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'sales' AND column_name = 'items'`
    );
    _hasItemsCol = r.rows.length > 0;
  } catch {
    _hasItemsCol = false;
  }
  return _hasItemsCol;
};

// GET /api/salesrecords

exports.getSalesRecords = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const {
    page      = 1,
    limit     = 15,
    search    = '',
    store_id  = '',
    payment   = '',
    date_from = '',
    date_to   = '',
  } = req.query;

  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const hasItems = await checkItemsColumn(req.shopDB);

  try {
    const conditions = ['1=1'];
    const params     = [];
    let   idx        = 1;

    if (search.trim()) {
      conditions.push(
        `(s.receipt_no ILIKE $${idx} OR u.name ILIKE $${idx})`
      );
      params.push(`%${search.trim()}%`);
      idx++;
    }
    if (store_id) {
      conditions.push(`s.store_id = $${idx}`);
      params.push(parseInt(store_id));
      idx++;
    }
    if (payment) {
      conditions.push(`LOWER(s.payment_method) = LOWER($${idx})`);
      params.push(payment);
      idx++;
    }
    if (date_from) {
      conditions.push(`s.created_at >= $${idx}`);
      params.push(date_from);
      idx++;
    }
    if (date_to) {
      conditions.push(`s.created_at < ($${idx}::date + INTERVAL '1 day')`);
      params.push(date_to);
      idx++;
    }

    const where = conditions.join(' AND ');

    // Count — join users so WHERE on u.name doesn't fail
    const countResult = await req.shopDB.query(
      `SELECT COUNT(*)
       FROM sales s
       LEFT JOIN users u ON u.user_id = s.user_id
       WHERE ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const itemsCol = hasItems ? 's.items,' : '';

    // item_count: try sale_items join first, fall back to jsonb array length
    const itemCountExpr = hasItems
      ? `COALESCE(
           (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.sale_id),
           CASE WHEN jsonb_typeof(s.items) = 'array' THEN jsonb_array_length(s.items) ELSE 0 END
         )`
      : `COALESCE((SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.sale_id), 0)`;

    const dataResult = await req.shopDB.query(
      `SELECT
         s.sale_id,
         s.receipt_no,
         s.store_id,
         s.user_id,
         u.name          AS cashier_name,
         ${itemsCol}
         ${itemCountExpr} AS item_count,
         s.subtotal,
         s.tax,
         s.discount,
         s.total,
         s.payment_method,
         s.created_at    AS sale_date,
         st.name         AS store_name
       FROM sales s
       LEFT JOIN users  u  ON u.user_id   = s.user_id
       LEFT JOIN stores st ON st.store_id = s.store_id
       WHERE ${where}
       ORDER BY s.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      sales:       dataResult.rows,
      total,
      page:        parseInt(page),
      limit:       parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit)),
    });

  } catch (err) {
    console.error('[SALESRECORDS] getSalesRecords:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/salesrecords/summary

exports.getSalesSummary = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { range = 'today' } = req.query;
  const hasItems = await checkItemsColumn(req.shopDB);

  let intervalClause;
  if      (range === 'today')      intervalClause = `s.created_at >= CURRENT_DATE`;
  else if (range === 'this_week')  intervalClause = `s.created_at >= date_trunc('week', NOW())`;
  else if (range === 'this_month') intervalClause = `s.created_at >= date_trunc('month', NOW())`;
  else                             intervalClause = `1=1`;

  try {
    // KPIs
    const kpiResult = await req.shopDB.query(
      `SELECT
         COALESCE(SUM(total),    0) AS total_sales,
         COUNT(*)                   AS total_transactions,
         COALESCE(AVG(total),    0) AS avg_order,
         COALESCE(SUM(discount), 0) AS total_discounts,
         COALESCE(SUM(tax),      0) AS total_tax
       FROM sales s
       WHERE ${intervalClause}`
    );

    // Chart — group by day/week depending on range
    let chartResult;
    if (range === 'today') {
      // Hourly breakdown for today
      chartResult = await req.shopDB.query(
        `SELECT
           TO_CHAR(date_trunc('hour', created_at), 'HH12AM') AS day_label,
           date_trunc('hour', created_at)                    AS sale_day,
           COALESCE(SUM(total), 0)                           AS daily_total
         FROM sales
         WHERE created_at >= CURRENT_DATE
         GROUP BY date_trunc('hour', created_at)
         ORDER BY date_trunc('hour', created_at) ASC`
      );
    } else if (range === 'this_week') {
      // Daily breakdown for current week
      chartResult = await req.shopDB.query(
        `SELECT
           TO_CHAR(created_at::date, 'Dy')  AS day_label,
           created_at::date                 AS sale_day,
           COALESCE(SUM(total), 0)          AS daily_total
         FROM sales
         WHERE created_at >= date_trunc('week', NOW())
         GROUP BY created_at::date
         ORDER BY created_at::date ASC`
      );
    } else if (range === 'this_month') {
      // Week-over-week breakdown for current month
      chartResult = await req.shopDB.query(
        `SELECT
           'Wk ' || TO_CHAR(created_at, 'W')  AS day_label,
           date_trunc('week', created_at)      AS sale_day,
           COALESCE(SUM(total), 0)             AS daily_total
         FROM sales
         WHERE created_at >= date_trunc('month', NOW())
         GROUP BY date_trunc('week', created_at), TO_CHAR(created_at, 'W')
         ORDER BY date_trunc('week', created_at) ASC`
      );
    } else {
      // All time — monthly breakdown, last 12 months
      chartResult = await req.shopDB.query(
        `SELECT
           TO_CHAR(date_trunc('month', created_at), 'Mon YY') AS day_label,
           date_trunc('month', created_at)                    AS sale_day,
           COALESCE(SUM(total), 0)                            AS daily_total
         FROM sales
         WHERE created_at >= NOW() - INTERVAL '12 months'
         GROUP BY date_trunc('month', created_at)
         ORDER BY date_trunc('month', created_at) ASC`
      );
    }

    // Sales by store
    const storeResult = await req.shopDB.query(
      `SELECT
         s.store_id,
         st.name                    AS store_name,
         COALESCE(SUM(s.total), 0)  AS store_total,
         COUNT(*)                   AS transactions
       FROM sales s
       LEFT JOIN stores st ON st.store_id = s.store_id
       WHERE ${intervalClause}
       GROUP BY s.store_id, st.name
       ORDER BY store_total DESC
       LIMIT 6`
    );

    // Top products — only if items JSONB column exists
    let topProductsRows = [];
    if (hasItems) {
      try {
        const r = await req.shopDB.query(
          `SELECT
             item->>'name'                                                   AS product_name,
             SUM((item->>'quantity')::numeric)                               AS total_qty,
             SUM((item->>'price')::numeric * (item->>'quantity')::numeric)   AS total_revenue
           FROM sales s,
                jsonb_array_elements(s.items) AS item
           WHERE ${intervalClause}
           GROUP BY item->>'name'
           ORDER BY total_revenue DESC
           LIMIT 5`
        );
        topProductsRows = r.rows;
      } catch { /* malformed items data — skip */ }
    }

    // Payment breakdown
    const paymentResult = await req.shopDB.query(
      `SELECT
         payment_method,
         COUNT(*)                  AS count,
         COALESCE(SUM(total), 0)   AS total_amount
       FROM sales s
       WHERE ${intervalClause}
       GROUP BY payment_method`
    );

    const kpi = kpiResult.rows[0];

    res.json({
      kpi: {
        total_sales:        parseFloat(kpi.total_sales),
        total_transactions: parseInt(kpi.total_transactions),
        avg_order:          parseFloat(kpi.avg_order),
        total_discounts:    parseFloat(kpi.total_discounts),
        total_tax:          parseFloat(kpi.total_tax),
      },
      chart:        chartResult.rows,
      by_store:     storeResult.rows,
      top_products: topProductsRows,
      by_payment:   paymentResult.rows,
    });

  } catch (err) {
    console.error('[SALESRECORDS] getSalesSummary:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/salesrecords/:id
exports.getSaleById = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id }   = req.params;
  const hasItems = await checkItemsColumn(req.shopDB);
  const itemsCol = hasItems ? 's.items,' : '';

  try {
    const result = await req.shopDB.query(
      `SELECT
         s.sale_id, s.receipt_no, s.store_id, s.user_id,
         u.name        AS cashier_name,
         ${itemsCol}
         s.subtotal, s.tax, s.discount, s.total,
         s.payment_method,
         s.created_at  AS sale_date,
         st.name       AS store_name
       FROM sales s
       LEFT JOIN users  u  ON u.user_id   = s.user_id
       LEFT JOIN stores st ON st.store_id = s.store_id
       WHERE s.sale_id = $1`,
      [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Sale record not found.' });

    const sale = result.rows[0];

    // Always fetch line items from sale_items table
    const itemsResult = await req.shopDB.query(
      `SELECT
         si.sale_item_id,
         si.quantity,
         si.price,
         si.total,
         p.name         AS name,
         p.barcode      AS barcode
       FROM sale_items si
       LEFT JOIN products p ON p.product_id = si.product_id
       WHERE si.sale_id = $1
       ORDER BY si.sale_item_id ASC`,
      [id]
    );

    // Merge: prefer sale_items rows; fall back to JSONB if empty
    if (itemsResult.rows.length > 0) {
      sale.items = itemsResult.rows;
    } else if (!Array.isArray(sale.items)) {
      sale.items = [];
    }

    res.json(sale);
  } catch (err) {
    console.error('[SALESRECORDS] getSaleById:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};