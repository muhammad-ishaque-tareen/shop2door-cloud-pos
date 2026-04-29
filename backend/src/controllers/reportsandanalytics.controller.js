// Endpoints: overview, sales-report, inventory-report, store-performance, product-analysis, payment-report

//  Interval Helpers
const buildInterval = (range) => {
  if (range === 'today'      || range === 'daily')    return `s.created_at >= CURRENT_DATE`;
  if (range === 'this_week'  || range === 'weekly')   return `s.created_at >= date_trunc('week', NOW())`;
  if (range === 'this_month' || range === 'monthly')  return `s.created_at >= date_trunc('month', NOW())`;
  if (range === 'this_year'  || range === 'yearly')   return `s.created_at >= date_trunc('year', NOW())`;
  if (range === 'all_time')                           return `1=1`;
  return `s.created_at >= date_trunc('month', NOW())`; // default
};

const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

const buildCustomInterval = (dateFrom, dateTo) => {
  const conds = [];
  if (dateFrom && isValidDate(dateFrom)) conds.push(`s.created_at >= '${dateFrom}'::date`);
  if (dateTo   && isValidDate(dateTo))   conds.push(`s.created_at < ('${dateTo}'::date + INTERVAL '1 day')`);
  return conds.length ? conds.join(' AND ') : '1=1';
};

const buildWhere = (range, dateFrom, dateTo, storeId) => {
  let w = range === 'custom'
    ? buildCustomInterval(dateFrom, dateTo)
    : buildInterval(range);
  if (storeId) w += ` AND s.store_id = ${parseInt(storeId)}`;
  return w;
};

// Previous period for trend comparison
const buildPrevInterval = (range) => {
  if (range === 'today'      || range === 'daily')    return `s.created_at >= CURRENT_DATE - INTERVAL '1 day' AND s.created_at < CURRENT_DATE`;
  if (range === 'this_week'  || range === 'weekly')   return `s.created_at >= date_trunc('week', NOW()) - INTERVAL '1 week' AND s.created_at < date_trunc('week', NOW())`;
  if (range === 'this_month' || range === 'monthly')  return `s.created_at >= date_trunc('month', NOW()) - INTERVAL '1 month' AND s.created_at < date_trunc('month', NOW())`;
  if (range === 'this_year'  || range === 'yearly')   return `s.created_at >= date_trunc('year', NOW()) - INTERVAL '1 year' AND s.created_at < date_trunc('year', NOW())`;
  return null;
};

const pct = (curr, prev) => {
  const c = parseFloat(curr), p = parseFloat(prev);
  if (!p) return null;
  return Math.round(((c - p) / p) * 100);
};

//  GET /api/reportsandanalytics/overview
exports.getOverview = async (req, res) => {
  if (!req.shopDB) return res.status(500).json({ message: 'Database connection unavailable.' });

  const { range = 'this_month', store_id = '', date_from = '', date_to = '' } = req.query;
  const sf = store_id ? `AND s.store_id = ${parseInt(store_id)}` : '';

  try {
    const where     = buildWhere(range, date_from, date_to, store_id);
    const prevRange = buildPrevInterval(range);

    // Current KPIs
    const currRes = await req.shopDB.query(`
      SELECT
        COALESCE(SUM(s.total),    0) AS total_revenue,
        COUNT(*)                     AS total_transactions,
        COALESCE(AVG(s.total),    0) AS avg_order_value,
        COALESCE(SUM(s.discount), 0) AS total_discounts,
        COALESCE(SUM(s.tax),      0) AS total_tax
      FROM sales s
      WHERE ${where}
    `);

    // Previous KPIs for trends
    let prevData = null;
    if (prevRange) {
      const prevRes = await req.shopDB.query(`
        SELECT
          COALESCE(SUM(s.total),    0) AS total_revenue,
          COUNT(*)                     AS total_transactions,
          COALESCE(AVG(s.total),    0) AS avg_order_value,
          COALESCE(SUM(s.discount), 0) AS total_discounts
        FROM sales s
        WHERE ${prevRange} ${sf}
      `);
      prevData = prevRes.rows[0];
    }

    const curr = currRes.rows[0];
    const kpi = {
      total_revenue:      parseFloat(curr.total_revenue),
      total_transactions: parseInt(curr.total_transactions),
      avg_order_value:    parseFloat(curr.avg_order_value),
      total_discounts:    parseFloat(curr.total_discounts),
      total_tax:          parseFloat(curr.total_tax),
      revenue_change:     prevData ? pct(curr.total_revenue,      prevData.total_revenue)      : null,
      transaction_change: prevData ? pct(curr.total_transactions,  prevData.total_transactions) : null,
      avg_change:         prevData ? pct(curr.avg_order_value,     prevData.avg_order_value)    : null,
      discount_change:    prevData ? pct(curr.total_discounts,     prevData.total_discounts)    : null,
    };

    // Chart data (auto-granularity)
    let chartRes;
    if (range === 'today' || range === 'daily') {
      chartRes = await req.shopDB.query(`
        SELECT TO_CHAR(date_trunc('hour', s.created_at), 'HH12AM') AS label,
               COALESCE(SUM(s.total),0) AS value, COUNT(*) AS transactions
        FROM sales s WHERE s.created_at >= CURRENT_DATE ${sf}
        GROUP BY date_trunc('hour', s.created_at)
        ORDER BY date_trunc('hour', s.created_at)
      `);
    } else if (range === 'this_week' || range === 'weekly') {
      chartRes = await req.shopDB.query(`
        SELECT TO_CHAR(s.created_at::date,'Dy') AS label,
               COALESCE(SUM(s.total),0) AS value, COUNT(*) AS transactions
        FROM sales s WHERE s.created_at >= date_trunc('week',NOW()) ${sf}
        GROUP BY s.created_at::date ORDER BY s.created_at::date
      `);
    } else if (range === 'this_month' || range === 'monthly') {
      chartRes = await req.shopDB.query(`
        SELECT TO_CHAR(s.created_at::date,'DD') AS label,
               COALESCE(SUM(s.total),0) AS value, COUNT(*) AS transactions
        FROM sales s WHERE s.created_at >= date_trunc('month',NOW()) ${sf}
        GROUP BY s.created_at::date ORDER BY s.created_at::date
      `);
    } else if (range === 'this_year' || range === 'yearly') {
      chartRes = await req.shopDB.query(`
        SELECT TO_CHAR(date_trunc('month',s.created_at),'Mon') AS label,
               COALESCE(SUM(s.total),0) AS value, COUNT(*) AS transactions
        FROM sales s WHERE s.created_at >= date_trunc('year',NOW()) ${sf}
        GROUP BY date_trunc('month',s.created_at) ORDER BY date_trunc('month',s.created_at)
      `);
    } else {
      chartRes = await req.shopDB.query(`
        SELECT TO_CHAR(date_trunc('month',s.created_at),'Mon YY') AS label,
               COALESCE(SUM(s.total),0) AS value, COUNT(*) AS transactions
        FROM sales s WHERE 1=1 ${sf}
        GROUP BY date_trunc('month',s.created_at) ORDER BY date_trunc('month',s.created_at)
      `);
    }

    // Payment breakdown
    const payRes = await req.shopDB.query(`
      SELECT COALESCE(INITCAP(s.payment_method),'Unknown') AS method,
             COUNT(*) AS transaction_count,
             COALESCE(SUM(s.total),0) AS total_amount
      FROM sales s WHERE ${where}
      GROUP BY s.payment_method ORDER BY total_amount DESC
    `);

    // Revenue by store
    const storeRes = await req.shopDB.query(`
      SELECT st.store_id, COALESCE(st.name,'Unknown') AS store_name,
             COUNT(*) AS transactions,
             COALESCE(SUM(s.total),0) AS total_revenue
      FROM sales s
      LEFT JOIN stores st ON st.store_id = s.store_id
      WHERE ${where}
      GROUP BY s.store_id, st.store_id, st.name ORDER BY total_revenue DESC
    `);

    // Top products — historical, no is_active filter (archived products still count in past sales)
    let topProducts = [];
    try {
      const topRes = await req.shopDB.query(`
        SELECT p.name AS product_name,
               SUM(si.quantity) AS total_qty,
               COALESCE(SUM(si.total),0) AS total_revenue
        FROM sale_items si
        JOIN sales s    ON s.sale_id    = si.sale_id
        JOIN products p ON p.product_id = si.product_id
        WHERE ${where}
        GROUP BY p.product_id, p.name
        ORDER BY total_revenue DESC LIMIT 8
      `);
      topProducts = topRes.rows;
    } catch { /* skip */ }

    // Low stock alert count — only active products
    let lowStockCount = 0;
    try {
      const lsRes = await req.shopDB.query(`
        SELECT COUNT(*) AS cnt
        FROM store_inventory si
        JOIN products p ON p.product_id = si.product_id
        WHERE si.quantity <= 5
          AND p.is_active = TRUE
          ${store_id ? `AND si.store_id = ${parseInt(store_id)}` : ''}
      `);
      lowStockCount = parseInt(lsRes.rows[0]?.cnt || 0);
    } catch { /* skip */ }

    // Returns count this month
    let returnsCount = 0;
    try {
      const retRes = await req.shopDB.query(`
        SELECT COUNT(*) AS cnt FROM returns
        WHERE created_at >= date_trunc('month', NOW())
      `);
      returnsCount = parseInt(retRes.rows[0]?.cnt || 0);
    } catch { /* skip */ }

    res.json({
      kpi,
      chart:           chartRes.rows,
      by_payment:      payRes.rows,
      by_store:        storeRes.rows,
      top_products:    topProducts,
      low_stock_count: lowStockCount,
      returns_count:   returnsCount,
    });
  } catch (err) {
    console.error('[REPORTS] getOverview:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

//  GET /api/reportsandanalytics/sales-report
exports.getSalesReport = async (req, res) => {
  if (!req.shopDB) return res.status(500).json({ message: 'Database connection unavailable.' });

  const {
    range = 'this_month', store_id = '', payment = '',
    date_from = '', date_to = '',
    page = 1, limit = 20,
  } = req.query;

  const pg     = Math.max(1, parseInt(page));
  const lim    = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pg - 1) * lim;

  try {
    const where  = buildWhere(range, date_from, date_to, store_id);
    const params = [];
    let   payF   = '';
    if (payment) {
      params.push(payment.toLowerCase());
      payF = `AND LOWER(s.payment_method) = $${params.length}`;
    }

    // Summary totals
    const summaryRes = await req.shopDB.query(`
      SELECT
        COUNT(*)                     AS total_transactions,
        COALESCE(SUM(s.total),    0) AS total_revenue,
        COALESCE(SUM(s.subtotal), 0) AS total_subtotal,
        COALESCE(SUM(s.discount), 0) AS total_discounts,
        COALESCE(SUM(s.tax),      0) AS total_tax,
        COALESCE(AVG(s.total),    0) AS avg_order_value
      FROM sales s WHERE ${where} ${payF}
    `, params);

    // Paginated sales list — includes status so frontend can show Returned badge
    const salesRes = await req.shopDB.query(`
      SELECT
        s.sale_id,
        s.receipt_no,
        s.created_at  AS sale_date,
        s.status,
        u.name        AS cashier_name,
        st.name       AS store_name,
        COALESCE((SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.sale_id), 0) AS item_count,
        s.subtotal,
        s.discount,
        s.tax,
        s.total,
        s.payment_method
      FROM sales s
      LEFT JOIN users  u  ON u.user_id   = s.user_id
      LEFT JOIN stores st ON st.store_id = s.store_id
      WHERE ${where} ${payF}
      ORDER BY s.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `, params);

    // Daily summary for mini-chart
    const dailyRes = await req.shopDB.query(`
      SELECT s.created_at::date AS sale_date,
             COUNT(*) AS daily_transactions,
             COALESCE(SUM(s.total),0) AS daily_revenue
      FROM sales s WHERE ${where} ${payF}
      GROUP BY s.created_at::date ORDER BY sale_date ASC
    `, params);

    // Store breakdown
    const storeBreakRes = await req.shopDB.query(`
      SELECT COALESCE(st.name,'Unknown') AS store_name,
             COUNT(*) AS transactions,
             COALESCE(SUM(s.total),0) AS revenue
      FROM sales s
      LEFT JOIN stores st ON st.store_id = s.store_id
      WHERE ${where} ${payF}
      GROUP BY s.store_id, st.name ORDER BY revenue DESC
    `, params);

    const total      = parseInt(summaryRes.rows[0].total_transactions);
    const totalPages = Math.max(1, Math.ceil(total / lim));

    res.json({
      summary:         summaryRes.rows[0],
      sales:           salesRes.rows,
      daily_summary:   dailyRes.rows,
      store_breakdown: storeBreakRes.rows,
      total,
      total_pages:     totalPages,
      page:            pg,
    });
  } catch (err) {
    console.error('[REPORTS] getSalesReport:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

//  GET /api/reportsandanalytics/inventory-report
exports.getInventoryReport = async (req, res) => {
  if (!req.shopDB) return res.status(500).json({ message: 'Database connection unavailable.' });

  const { store_id = '', category_id = '' } = req.query;
  const sf = store_id    ? `AND si.store_id   = ${parseInt(store_id)}`    : '';
  const cf = category_id ? `AND p.category_id = ${parseInt(category_id)}` : '';

  try {
    // Current stock levels — only active products
    const stockRes = await req.shopDB.query(`
      SELECT
        p.product_id,
        p.name AS product_name,
        p.barcode,
        COALESCE(c.name,'Uncategorized')            AS category_name,
        COALESCE(st.name,'Unknown')                 AS store_name,
        si.quantity                                 AS current_stock,
        COALESCE(si.price, p.price)                 AS unit_price,
        si.quantity * COALESCE(si.price, p.price)   AS stock_value,
        CASE
          WHEN si.quantity = 0   THEN 'Out of Stock'
          WHEN si.quantity <= 5  THEN 'Low Stock'
          WHEN si.quantity <= 20 THEN 'Medium'
          ELSE 'In Stock'
        END AS stock_status
      FROM store_inventory si
      JOIN products p         ON p.product_id   = si.product_id
      LEFT JOIN categories c  ON c.category_id  = p.category_id
      LEFT JOIN stores st     ON st.store_id     = si.store_id
      WHERE p.is_active = TRUE ${sf} ${cf}
      ORDER BY si.quantity ASC, p.name ASC
    `);

    // Aggregate stats
    const products = stockRes.rows;
    const stats = {
      total_products:     products.length,
      total_stock_value:  products.reduce((s, p) => s + parseFloat(p.stock_value || 0), 0),
      low_stock_count:    products.filter(p => p.stock_status === 'Low Stock').length,
      out_of_stock_count: products.filter(p => p.stock_status === 'Out of Stock').length,
      in_stock_count:     products.filter(p => p.stock_status === 'In Stock').length,
    };

    // By store — only active products
    const byStoreRes = await req.shopDB.query(`
      SELECT COALESCE(st.name,'Unknown') AS store_name,
             COUNT(DISTINCT si.product_id) AS product_count,
             COALESCE(SUM(si.quantity),0)  AS total_units,
             COALESCE(SUM(si.quantity * COALESCE(si.price, p.price)),0) AS total_value
      FROM store_inventory si
      JOIN products p     ON p.product_id = si.product_id
      LEFT JOIN stores st ON st.store_id  = si.store_id
      WHERE p.is_active = TRUE ${sf} ${cf}
      GROUP BY si.store_id, st.name ORDER BY total_value DESC
    `);

    // By category — only active products
    const byCatRes = await req.shopDB.query(`
      SELECT COALESCE(c.name,'Uncategorized') AS category_name,
             COUNT(DISTINCT si.product_id) AS product_count,
             COALESCE(SUM(si.quantity),0)  AS total_units,
             COALESCE(SUM(si.quantity * COALESCE(si.price, p.price)),0) AS total_value
      FROM store_inventory si
      JOIN products p         ON p.product_id  = si.product_id
      LEFT JOIN categories c  ON c.category_id = p.category_id
      WHERE p.is_active = TRUE ${sf} ${cf}
      GROUP BY p.category_id, c.name ORDER BY total_value DESC
    `);

    // Stock-in: supply orders last 30 days
    let stockIn = [];
    try {
      const siRes = await req.shopDB.query(`
        SELECT p.name AS product_name,
               COALESCE(st.name,'Unknown')   AS store_name,
               soi.quantity                  AS qty_received,
               soi.price                     AS unit_price,
               so.created_at                 AS received_date,
               COALESCE(sup.name,'Unknown')  AS supplier_name
        FROM supply_order_items soi
        JOIN supply_orders so   ON so.order_id     = soi.order_id
        JOIN products p         ON p.product_id    = soi.product_id
        LEFT JOIN stores st     ON st.store_id     = so.store_id
        LEFT JOIN suppliers sup ON sup.supplier_id = so.supplier_id
        WHERE so.created_at >= NOW() - INTERVAL '30 days'
          ${store_id ? `AND so.store_id = ${parseInt(store_id)}` : ''}
        ORDER BY so.created_at DESC LIMIT 50
      `);
      stockIn = siRes.rows;
    } catch { /* skip */ }

    // Stock-out: sold last 30 days — historical, no is_active filter
    let stockOut = [];
    try {
      const soRes = await req.shopDB.query(`
        SELECT p.name AS product_name,
               COALESCE(st.name,'Unknown') AS store_name,
               SUM(si_items.quantity)      AS qty_sold,
               SUM(si_items.total)         AS revenue,
               MIN(s.created_at::date)     AS first_sale,
               MAX(s.created_at::date)     AS last_sale
        FROM sale_items si_items
        JOIN sales s    ON s.sale_id    = si_items.sale_id
        JOIN products p ON p.product_id = si_items.product_id
        LEFT JOIN stores st ON st.store_id = s.store_id
        WHERE s.created_at >= NOW() - INTERVAL '30 days'
          ${store_id    ? `AND s.store_id        = ${parseInt(store_id)}`    : ''}
          ${category_id ? `AND p.category_id     = ${parseInt(category_id)}` : ''}
        GROUP BY p.product_id, p.name, st.store_id, st.name
        ORDER BY qty_sold DESC LIMIT 50
      `);
      stockOut = soRes.rows;
    } catch { /* skip */ }

    res.json({
      stats,
      products,
      by_store:    byStoreRes.rows,
      by_category: byCatRes.rows,
      stock_in:    stockIn,
      stock_out:   stockOut,
    });
  } catch (err) {
    console.error('[REPORTS] getInventoryReport:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

//  GET /api/reportsandanalytics/store-performance
exports.getStorePerformance = async (req, res) => {
  if (!req.shopDB) return res.status(500).json({ message: 'Database connection unavailable.' });

  const { range = 'this_month', date_from = '', date_to = '' } = req.query;

  try {
    const where = range === 'custom'
      ? buildCustomInterval(date_from, date_to)
      : buildInterval(range);

    const storeRes = await req.shopDB.query(`
      SELECT
        s.store_id,
        COALESCE(st.name,'Unknown Store')  AS store_name,
        COALESCE(st.address,'')            AS address,
        COUNT(*)                           AS total_transactions,
        COALESCE(SUM(s.total),    0)       AS total_revenue,
        COALESCE(AVG(s.total),    0)       AS avg_order_value,
        COALESCE(SUM(s.discount), 0)       AS total_discounts,
        COALESCE(SUM(s.tax),      0)       AS total_tax,
        COALESCE(SUM(s.subtotal), 0)       AS total_subtotal,
        COUNT(DISTINCT s.user_id)          AS active_cashiers,
        COUNT(*) FILTER (WHERE LOWER(s.payment_method)='cash')   AS cash_txns,
        COUNT(*) FILTER (WHERE LOWER(s.payment_method)='card')   AS card_txns,
        COUNT(*) FILTER (WHERE LOWER(s.payment_method)='mobile') AS mobile_txns
      FROM sales s
      LEFT JOIN stores st ON st.store_id = s.store_id
      WHERE ${where}
      GROUP BY s.store_id, st.name, st.address
      ORDER BY total_revenue DESC
    `);

    // Daily breakdown by store
    const dailyRes = await req.shopDB.query(`
      SELECT COALESCE(st.name,'Unknown') AS store_name,
             s.created_at::date          AS sale_date,
             COUNT(*)                    AS transactions,
             COALESCE(SUM(s.total),0)    AS revenue
      FROM sales s
      LEFT JOIN stores st ON st.store_id = s.store_id
      WHERE ${where}
      GROUP BY s.store_id, st.name, s.created_at::date
      ORDER BY st.name, sale_date ASC
    `);

    res.json({
      stores:          storeRes.rows,
      daily_breakdown: dailyRes.rows,
    });
  } catch (err) {
    console.error('[REPORTS] getStorePerformance:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

//  GET /api/reportsandanalytics/product-analysis
exports.getProductAnalysis = async (req, res) => {
  if (!req.shopDB) return res.status(500).json({ message: 'Database connection unavailable.' });

  const { range = 'this_month', store_id = '', date_from = '', date_to = '' } = req.query;

  try {
    const where = buildWhere(range, date_from, date_to, store_id);

    // Top selling products — historical, no is_active filter
    let topRes = { rows: [] };
    try {
      topRes = await req.shopDB.query(`
        SELECT
          p.product_id,
          p.name                           AS product_name,
          p.barcode,
          COALESCE(c.name,'Uncategorized') AS category_name,
          SUM(si.quantity)                 AS total_qty_sold,
          COALESCE(SUM(si.total),0)        AS total_revenue,
          COALESCE(AVG(si.price),0)        AS avg_price,
          COUNT(DISTINCT si.sale_id)       AS times_in_sale
        FROM sale_items si
        JOIN sales s    ON s.sale_id    = si.sale_id
        JOIN products p ON p.product_id = si.product_id
        LEFT JOIN categories c ON c.category_id = p.category_id
        WHERE ${where}
        GROUP BY p.product_id, p.name, p.barcode, c.name
        ORDER BY total_revenue DESC LIMIT 20
      `);
    } catch { /* skip */ }

    // Slow movers — current stock view, only active products
    let slowMovers = [];
    try {
      const smRes = await req.shopDB.query(`
        SELECT
          p.name                           AS product_name,
          COALESCE(c.name,'Uncategorized') AS category_name,
          COALESCE(SUM(si.quantity),0)     AS total_qty_sold,
          COALESCE(SUM(si.total),0)        AS total_revenue
        FROM products p
        LEFT JOIN categories c   ON c.category_id = p.category_id
        LEFT JOIN sale_items si  ON si.product_id  = p.product_id
        LEFT JOIN sales s        ON s.sale_id = si.sale_id AND (${where})
        ${store_id ? `JOIN store_inventory inv ON inv.product_id = p.product_id AND inv.store_id = ${parseInt(store_id)}` : ''}
        WHERE p.is_active = TRUE
        GROUP BY p.product_id, p.name, c.name
        ORDER BY total_qty_sold ASC, total_revenue ASC LIMIT 10
      `);
      slowMovers = smRes.rows;
    } catch { /* skip */ }

    // By category — historical, no is_active filter
    let byCat = [];
    try {
      const catRes = await req.shopDB.query(`
        SELECT
          COALESCE(c.name,'Uncategorized') AS category_name,
          COUNT(DISTINCT p.product_id)     AS product_count,
          COALESCE(SUM(si.quantity),0)     AS total_qty_sold,
          COALESCE(SUM(si.total),0)        AS total_revenue
        FROM sale_items si
        JOIN sales s    ON s.sale_id    = si.sale_id
        JOIN products p ON p.product_id = si.product_id
        LEFT JOIN categories c ON c.category_id = p.category_id
        WHERE ${where}
        GROUP BY c.category_id, c.name ORDER BY total_revenue DESC
      `);
      byCat = catRes.rows;
    } catch { /* skip */ }

    res.json({
      top_products: topRes.rows,
      slow_movers:  slowMovers,
      by_category:  byCat,
    });
  } catch (err) {
    console.error('[REPORTS] getProductAnalysis:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

//  GET /api/reportsandanalytics/payment-report
exports.getPaymentReport = async (req, res) => {
  if (!req.shopDB) return res.status(500).json({ message: 'Database connection unavailable.' });

  const { range = 'this_month', store_id = '', date_from = '', date_to = '' } = req.query;

  try {
    const where = buildWhere(range, date_from, date_to, store_id);

    const methodRes = await req.shopDB.query(`
      SELECT
        COALESCE(INITCAP(s.payment_method),'Unknown') AS method,
        COUNT(*)                                       AS transaction_count,
        COALESCE(SUM(s.total),    0)                  AS total_amount,
        COALESCE(AVG(s.total),    0)                  AS avg_amount,
        COALESCE(SUM(s.discount), 0)                  AS total_discount,
        COALESCE(SUM(s.tax),      0)                  AS total_tax
      FROM sales s WHERE ${where}
      GROUP BY s.payment_method ORDER BY total_amount DESC
    `);

    const dailyRes = await req.shopDB.query(`
      SELECT s.created_at::date AS sale_date,
             COALESCE(INITCAP(s.payment_method),'Unknown') AS method,
             COUNT(*) AS count,
             COALESCE(SUM(s.total),0) AS amount
      FROM sales s WHERE ${where}
      GROUP BY s.created_at::date, s.payment_method
      ORDER BY sale_date ASC, method
    `);

    const grand = methodRes.rows.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
    const count = methodRes.rows.reduce((s, r) => s + parseInt(r.transaction_count || 0), 0);

    res.json({
      by_method:   methodRes.rows,
      daily:       dailyRes.rows,
      grand_total: grand,
      grand_count: count,
    });
  } catch (err) {
    console.error('[REPORTS] getPaymentReport:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};