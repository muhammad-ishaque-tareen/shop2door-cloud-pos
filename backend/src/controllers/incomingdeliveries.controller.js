// incomingdeliveries.controller.js

/*
  GET /api/incoming-deliveries

  Store-scoped, read-only list of THIS store's pending supply orders.
  The store_id filter comes from the JWT (req.user.store_id), never from
  a query param — a cashier can only ever see deliveries addressed to
  their own store, no matter what they try to pass in the request.
*/
exports.getIncomingOrders = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const storeId = req.user.store_id;

  try {
    const ordersRes = await req.shopDB.query(
      `SELECT so.order_id, so.total, so.status, so.invoice_number,
              so.notes, so.created_at, s.name AS supplier_name
       FROM supply_orders so
       JOIN suppliers s ON s.supplier_id = so.supplier_id
       WHERE so.store_id = $1 AND so.status = 'pending'
       ORDER BY so.created_at ASC`,
      [storeId]
    );

    if (!ordersRes.rows.length) return res.json([]);

    const orderIds = ordersRes.rows.map(o => o.order_id);
    const itemsRes = await req.shopDB.query(
      `SELECT soi.order_item_id, soi.order_id, soi.product_id,
              soi.product_name, soi.quantity, soi.price,
              p.name AS linked_product_name
       FROM supply_order_items soi
       LEFT JOIN products p ON p.product_id = soi.product_id
       WHERE soi.order_id = ANY($1::int[])`,
      [orderIds]
    );

    const itemsByOrder = {};
    itemsRes.rows.forEach(item => {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push({
        order_item_id: item.order_item_id,
        product_id:    item.product_id,
        product_name:  item.linked_product_name || item.product_name || '—',
        quantity:      item.quantity,
        price:         item.price,
        // no product_id yet -> this line has never been onboarded as a
        // real product, so the cashier must supply a barcode to receive it
        needs_barcode: item.product_id === null,
      });
    });

    res.json(
      ordersRes.rows.map(o => ({ ...o, items: itemsByOrder[o.order_id] || [] }))
    );
  } catch (err) {
    console.error('[INCOMING] getIncomingOrders:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

/*
  PUT /api/incoming-deliveries/:orderId/receive
  Body: { barcodes: { [order_item_id]: "barcode string" } }

  - Verifies the order actually belongs to THIS user's store (never trusts
    the URL param alone — store_id always comes from the JWT)
  - Verifies it's still 'pending' (can't double-receive or resurrect a
    cancelled order)
  - For every line item with no product_id yet: creates the product row
    using the barcode the cashier just scanned/typed off the delivered
    item, and links it back onto the order line
  - Increments store_inventory + products.stock for every item (same
    pattern already used by suppliers.controller's updateOrderStatus)
  - Sets order status -> 'received'

  Deliberately does NOT read/accept price, quantity, notes, supplier_id,
  or a 'cancelled' status from the body — this endpoint can only ever
  confirm receipt of what the Shop Admin already ordered.
*/
exports.receiveOrder = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { orderId }       = req.params;
  const { barcodes = {} } = req.body;
  const storeId            = req.user.store_id;

  if (!orderId || isNaN(parseInt(orderId)))
    return res.status(400).json({ message: 'Invalid order id.' });

  const client = await req.shopDB.connect();
  try {
    await client.query('BEGIN');

    // Ownership + status check — locked to req.user.store_id, not a body param
    const ordRes = await client.query(
      `SELECT order_id, store_id, status FROM supply_orders WHERE order_id = $1`,
      [parseInt(orderId)]
    );
    if (!ordRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = ordRes.rows[0];
    if (order.store_id !== storeId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'This order is not addressed to your store.' });
    }
    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Order is already '${order.status}'.` });
    }

    // Load line items
    const itemsRes = await client.query(
      `SELECT order_item_id, product_id, product_name, quantity, price
       FROM supply_order_items
       WHERE order_id = $1`,
      [parseInt(orderId)]
    );

    for (const item of itemsRes.rows) {
      let productId = item.product_id;
      const qty     = parseFloat(item.quantity) || 0;

      // New product line — onboard it now using the barcode just captured
      if (!productId) {
        const barcode = String(barcodes[item.order_item_id] || '').trim();
        if (!barcode) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: `Barcode is required for "${item.product_name}" before this order can be received.`,
          });
        }

        const dupCheck = await client.query(
          `SELECT product_id FROM products WHERE barcode = $1`,
          [barcode]
        );
        if (dupCheck.rows.length) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            message: `Barcode "${barcode}" is already used by another product.`,
          });
        }

        const newProduct = await client.query(
          `INSERT INTO products (name, barcode, price, stock, quantity, store_id)
           VALUES ($1, $2, $3, 0, 1, $4)
           RETURNING product_id`,
          [item.product_name, barcode, item.price, storeId]
        );
        productId = newProduct.rows[0].product_id;

        await client.query(
          `UPDATE supply_order_items SET product_id = $1 WHERE order_item_id = $2`,
          [productId, item.order_item_id]
        );
      }

      // Mark this line fully received
      await client.query(
        `UPDATE supply_order_items SET quantity_received = $1 WHERE order_item_id = $2`,
        [qty, item.order_item_id]
      );

      // Add the incoming stock at this store
      await client.query(
        `INSERT INTO store_inventory (store_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (store_id, product_id)
         DO UPDATE SET quantity = store_inventory.quantity + EXCLUDED.quantity`,
        [storeId, productId, qty]
      );

      // Keep products.stock in sync (same pattern used elsewhere in the app)
      await client.query(
        `UPDATE products
         SET stock = stock + $1, quantity = quantity + $1
         WHERE product_id = $2`,
        [qty, productId]
      );
    }

    await client.query(
      `UPDATE supply_orders SET status = 'received' WHERE order_id = $1`,
      [parseInt(orderId)]
    );

    await client.query('COMMIT');
    res.json({ message: 'Delivery received and stock updated.', order_id: parseInt(orderId) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[INCOMING] receiveOrder:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  } finally {
    client.release();
  }
};