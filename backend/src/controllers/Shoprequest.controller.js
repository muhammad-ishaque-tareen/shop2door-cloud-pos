const { Pool }    = require("pg");
const masterPool  = require("../db/master.pool");
const nodemailer  = require("nodemailer");
const bcrypt      = require("bcrypt");

//  Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

//  Helper: generate unique SHOP CODE
//  Result example: "S2D-XQRT7"
const generateShopCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "S2D-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

//  Helper: generate unique db name
//  Result example: "shop_1714900123456"
const generateDbName = () => `shop_${Date.now()}`;

//  Helper: ensure generated shop code does not already exist
const getUniqueCode = async (client) => {
  let code;
  let exists = true;
  while (exists) {
    code = generateShopCode();
    const check = await client.query(
      "SELECT shop_id FROM shops WHERE code = $1",
      [code]
    );
    exists = check.rows.length > 0;
  }
  return code;
};

//  Helper: SQL to create ALL shop tables in the public schema
//  of a brand-new database. No schema prefix needed since
//  public is the default search_path.
const buildShopTablesSql = () => `
  -- 1. Stores (physical branches)
  CREATE TABLE IF NOT EXISTS stores (
    store_id   SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    address    TEXT,
    phone      VARCHAR(20),
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 2. Users (Store Manager, Cashier)
  CREATE TABLE IF NOT EXISTS users (
    user_id    SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    phone      VARCHAR(20) UNIQUE,
    password   TEXT NOT NULL,
    role       VARCHAR(30) NOT NULL,
    store_id   INT REFERENCES stores(store_id),
    image_url  TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 3. Categories
  CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
  );

  -- 4. Products
  CREATE TABLE IF NOT EXISTS products (
    product_id    SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    barcode       VARCHAR(100) UNIQUE,
    price         DECIMAL(10,2) NOT NULL,
    stock         INT DEFAULT 0,
    quantity      DECIMAL(10,2) DEFAULT 1,
    unit          VARCHAR(20),
    description   TEXT,
    category_id   INT REFERENCES categories(category_id),
    store_id      INT REFERENCES stores(store_id),
    image_url     TEXT,
    is_active     BOOLEAN DEFAULT TRUE,
    reorder_level INT DEFAULT 10,
    created_at    TIMESTAMP DEFAULT NOW()
  );

  -- 5. Store Inventory
  CREATE TABLE IF NOT EXISTS store_inventory (
    inventory_id SERIAL PRIMARY KEY,
    store_id     INT REFERENCES stores(store_id),
    product_id   INT REFERENCES products(product_id),
    quantity     DECIMAL(10,2) DEFAULT 0,
    price        DECIMAL(10,2),
    UNIQUE(store_id, product_id)
  );

  -- 6. Suppliers
  CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id    SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    phone          VARCHAR(20),
    email          VARCHAR(100),
    address        TEXT,
    contact_person VARCHAR(100),
    created_at     TIMESTAMP DEFAULT NOW()
  );

  -- 7. Supply Orders
  CREATE TABLE IF NOT EXISTS supply_orders (
    order_id       SERIAL PRIMARY KEY,
    store_id       INT REFERENCES stores(store_id),
    supplier_id    INT REFERENCES suppliers(supplier_id),
    user_id        INT REFERENCES users(user_id),
    total          DECIMAL(10,2),
    status         VARCHAR(20) DEFAULT 'pending',
    invoice_number VARCHAR(100),
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT NOW()
  );

  -- 8. Supply Order Items
  CREATE TABLE IF NOT EXISTS supply_order_items (
    order_item_id     SERIAL PRIMARY KEY,
    order_id          INT REFERENCES supply_orders(order_id),
    product_id        INT REFERENCES products(product_id),
    quantity          DECIMAL(10,2),
    price             DECIMAL(10,2),
    product_name      VARCHAR(200),
    quantity_received DECIMAL(10,2) DEFAULT 0
  );

  -- 9. Sales
  CREATE TABLE IF NOT EXISTS sales (
    sale_id        SERIAL PRIMARY KEY,
    receipt_no     VARCHAR(50) UNIQUE NOT NULL,
    store_id       INT REFERENCES stores(store_id),
    user_id        INT REFERENCES users(user_id),
    subtotal       DECIMAL(10,2),
    tax            DECIMAL(10,2) DEFAULT 0,
    discount       DECIMAL(10,2) DEFAULT 0,
    total          DECIMAL(10,2),
    payment_method VARCHAR(20),
    status         VARCHAR(20) DEFAULT 'completed',
    created_at     TIMESTAMP DEFAULT NOW()
  );

  -- 10. Sale Items
  CREATE TABLE IF NOT EXISTS sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id      INT REFERENCES sales(sale_id),
    product_id   INT REFERENCES products(product_id),
    quantity     DECIMAL(10,2),
    price        DECIMAL(10,2),
    total        DECIMAL(10,2)
  );

  -- 11. Returns
  CREATE TABLE IF NOT EXISTS returns (
    return_id  SERIAL PRIMARY KEY,
    sale_id    INT REFERENCES sales(sale_id),
    user_id    INT REFERENCES users(user_id),
    reason     TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 12. Return Items
  CREATE TABLE IF NOT EXISTS return_items (
    return_item_id SERIAL PRIMARY KEY,
    return_id      INT REFERENCES returns(return_id),
    product_id     INT REFERENCES products(product_id),
    sale_item_id   INT REFERENCES sale_items(sale_item_id),
    quantity       DECIMAL(10,2),
    unit_price     DECIMAL(10,2),
    subtotal       DECIMAL(10,2)
  );
`;

//  Helper: create a Pool connected to a specific database
const createPool = (database) =>
  new Pool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 5432,
    database,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });


//  Helper: send approval email to shop admin
const sendApprovalEmail = async (toEmail, toName, shopName, shopCode, tempPassword) => {
  await transporter.sendMail({
    from: `"Shop2Door" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🎉 Your Shop2Door Account is Approved!",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;
                  padding:32px;background:#f9f9f9;border-radius:12px;">
        <h2 style="color:#9c27b0;margin-bottom:4px;">Shop2Door</h2>
        <h3 style="color:#1f2937;margin-top:0;">Congratulations, ${toName}!</h3>
        <p style="color:#444;font-size:15px;">
          Your shop <strong>${shopName}</strong> has been approved and is now active.
          Here are your login credentials:
        </p>

        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;
                    padding:20px;margin:24px 0;">
          <table style="width:100%;font-size:14px;color:#374151;">
            <tr>
              <td style="padding:8px 0;font-weight:600;color:#6b7280;">Login Email</td>
              <td style="padding:8px 0;">${toEmail}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:600;color:#6b7280;">Temporary Password</td>
              <td style="padding:8px 0;font-family:monospace;font-size:16px;
                         color:#9c27b0;font-weight:700;">${tempPassword}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:600;color:#6b7280;">Shop Code</td>
              <td style="padding:8px 0;font-family:monospace;font-size:16px;
                         color:#059669;font-weight:700;">${shopCode}</td>
            </tr>
          </table>
        </div>

        <p style="color:#ef4444;font-size:13px;font-weight:600;">
          ⚠️ Please log in and change your password immediately.
        </p>
        <p style="color:#6b7280;font-size:13px;">
          Share the <strong>Shop Code</strong> with your Store Managers and Cashiers
          — they need it to log in.
        </p>
        <p style="color:#bbb;font-size:12px;margin-top:24px;">
          If you have any questions, contact Shop2Door support.
        </p>
      </div>
    `,
  });
};

//  Helper: send rejection email
const sendRejectionEmail = async (toEmail, toName, shopName, reason) => {
  await transporter.sendMail({
    from: `"Shop2Door" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Shop2Door — Shop Request Update",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;
                  padding:32px;background:#f9f9f9;border-radius:12px;">
        <h2 style="color:#9c27b0;margin-bottom:4px;">Shop2Door</h2>
        <h3 style="color:#1f2937;margin-top:0;">Hello, ${toName}</h3>
        <p style="color:#444;font-size:15px;">
          We're sorry to inform you that your shop request for
          <strong>${shopName}</strong> could not be approved at this time.
        </p>
        ${reason ? `
        <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;
                    border-radius:6px;margin:16px 0;">
          <p style="color:#dc2626;font-size:14px;margin:0;">
            <strong>Reason:</strong> ${reason}
          </p>
        </div>` : ""}
        <p style="color:#444;font-size:15px;">
          Please verify your payment details and contact Shop2Door support
          to resubmit your request.
        </p>
        <p style="color:#bbb;font-size:12px;margin-top:24px;">
          Shop2Door Support Team
        </p>
      </div>
    `,
  });
};

//  GET /api/shop-requests
//  Returns all pending/payment_submitted requests
exports.getShopRequests = async (req, res) => {
  try {
    const result = await masterPool.query(
      `SELECT
         sr.request_id,
         sr.shop_name,
         sr.shop_address,
         sr.shop_phone,
         sr.shop_logo_url,
         sr.opening_hours,
         sr.shop_type,
         sr.shop_email,
         sr.payment_method,
         sr.sender_account,
         sr.transaction_ref,
         sr.amount,
         sr.payment_date,
         sr.status,
         sr.created_at,
         u.user_id,
         u.name        AS full_name,
         u.email       AS user_email,
         u.phone       AS user_phone,
         pk.package_id,
         pk.name       AS package_name,
         pk.price      AS package_price
       FROM shop_requests sr
       JOIN users    u  ON sr.user_id    = u.user_id
       JOIN packages pk ON sr.package_id = pk.package_id
       WHERE sr.status IN ('payment_submitted', 'pending')
       ORDER BY sr.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[SHOP-REQUESTS] getShopRequests error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

//  POST /api/shop-requests/:id/approve
//
//  Flow:
//  Phase 1 — Platform DB transaction (BEGIN → COMMIT):
//    1. Fetch shop_request + user
//    2. Generate unique shop code
//    3. Generate unique db name
//    4. INSERT into shops
//    5. UPDATE users (assign shop_id, package_id)
//    6. INSERT into subscriptions
//    7. INSERT into usage
//    8. INSERT into payments
//    9. UPDATE shop_requests status = 'approved'
//   10. COMMIT
//
//  Phase 2 — New database creation (outside transaction):
//   11. CREATE DATABASE <dbName>  (connect via 'postgres' default db)
//   12. CREATE all tables in new DB's public schema
//
//  Phase 3 — Post-approval:
//   13. Generate temp password, update users table
//   14. Send approval email
exports.approveShopRequest = async (req, res) => {
  const { id } = req.params;
  const client = await masterPool.connect();
  let committed = false;

  try {
    await client.query("BEGIN");

    //  Step 1: Fetch shop_request + user 
    const reqResult = await client.query(
      `SELECT
         sr.*,
         u.name     AS user_name,
         u.email    AS user_email,
         u.password AS user_password
       FROM shop_requests sr
       JOIN users u ON sr.user_id = u.user_id
       WHERE sr.request_id = $1`,
      [id]
    );

    if (reqResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Shop request not found." });
    }

    const r = reqResult.rows[0];

    if (r.status === "approved") {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "This request is already approved." });
    }

    //  Step 2: Generate unique shop code 
    const shopCode = await getUniqueCode(client);

    //  Step 3: Generate unique database name 
    const dbName = generateDbName(); // e.g. "shop_1714900123456"

    //  Step 4: INSERT into shops 
    const shopResult = await client.query(
      `INSERT INTO shops
         (name, code, db_name, address, phone, logo_url, opening_hours,
          admin_email, package_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING shop_id`,
      [
        r.shop_name,
        shopCode,
        dbName,
        r.shop_address,
        r.shop_phone,
        r.shop_logo_url,
        r.opening_hours,
        r.user_email,
        r.package_id,
      ]
    );
    const shopId = shopResult.rows[0].shop_id;

    //  Step 5: UPDATE users — assign shop_id and package_id 
    await client.query(
      `UPDATE users SET shop_id = $1, package_id = $2 WHERE user_id = $3`,
      [shopId, r.package_id, r.user_id]
    );

    //  Step 6: INSERT into subscriptions 
    await client.query(
      `INSERT INTO subscriptions
         (shop_id, package_id, start_date, end_date, status)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'active')`,
      [shopId, r.package_id]
    );

    //  Step 7: INSERT into usage 
    await client.query(
      `INSERT INTO usage
         (shop_id, users_used, stores_used, products_used, storage_used)
       VALUES ($1, 0, 0, 0, 0)`,
      [shopId]
    );

    //  Step 8: INSERT into payments 
    await client.query(
      `INSERT INTO payments
         (user_id, shop_id, package_id, payment_method, sender_account,
          transaction_ref, amount, payment_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved')`,
      [
        r.user_id,
        shopId,
        r.package_id,
        r.payment_method,
        r.sender_account,
        r.transaction_ref,
        r.amount,
        r.payment_date,
      ]
    );

    //  Step 9: UPDATE shop_requests status = 'approved' 
    await client.query(
      `UPDATE shop_requests SET status = 'approved' WHERE request_id = $1`,
      [id]
    );

    //  Step 10: COMMIT platform transaction 
    await client.query("COMMIT");
    committed = true;

    //  Phase 2: CREATE new DATABASE (outside transaction)
    //  CREATE DATABASE is not allowed inside a transaction
    //  block in PostgreSQL, so it must run after COMMIT.
    //  We connect to the default 'postgres' database to
    //  issue the CREATE DATABASE command.

    //  Step 11: CREATE DATABASE 
    const adminPool = createPool("postgres");
    const adminClient = await adminPool.connect();
    try {
      // Must use autocommit — no BEGIN/COMMIT around CREATE DATABASE
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[SHOP-REQUESTS] ✅ Created new database: ${dbName}`);
    } finally {
      adminClient.release();
      await adminPool.end();
    }

    //  Step 12: CREATE all tables in the new database 
    const shopPool = createPool(dbName);
    const shopClient = await shopPool.connect();
    try {
      await shopClient.query(buildShopTablesSql());
      console.log(`[SHOP-REQUESTS] ✅ Created all tables in: ${dbName}`);
    } finally {
      shopClient.release();
      await shopPool.end();
    }

    //  Phase 3: Post-approval — temp password + email

    //  Step 13: Generate temp password and update user 
    const tempPassword = "Shop@" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const hashedTemp   = await bcrypt.hash(tempPassword, 12);

    await masterPool.query(
      `UPDATE users SET password = $1 WHERE user_id = $2`,
      [hashedTemp, r.user_id]
    );

    //  Step 14: Send approval email 
    try {
      await sendApprovalEmail(
        r.user_email,
        r.user_name,
        r.shop_name,
        shopCode,
        tempPassword
      );
    } catch (emailErr) {
      // Email failure must NOT undo the approval — just log it
      console.error("[SHOP-REQUESTS] Approval email failed:", emailErr.message);
    }

    console.log(
      `[SHOP-REQUESTS] ✅ Approved request_id=${id} → shop_id=${shopId} db="${dbName}" code="${shopCode}"`
    );

    return res.json({
      message: "Shop approved successfully. Credentials sent to shop admin.",
      shop_id: shopId,
      db_name: dbName,
      code:    shopCode,
    });

  } catch (error) {
    // Only rollback if we haven't committed yet
    if (!committed) {
      try { await client.query("ROLLBACK"); } catch (_) {}
    }
    console.error("[SHOP-REQUESTS] approveShopRequest error:", error.message);
    console.error(error.stack);
    return res.status(500).json({ message: "Server error", detail: error.message });
  } finally {
    client.release();
  }
};

//  POST /api/shop-requests/:id/reject
//  Body (optional): { reason }

exports.rejectShopRequest = async (req, res) => {
  const { id }     = req.params;
  const { reason } = req.body || {};

  try {
    //  Step 1: Fetch request 
    const reqResult = await masterPool.query(
      `SELECT
         sr.request_id,
         sr.shop_name,
         sr.status,
         u.name  AS user_name,
         u.email AS user_email
       FROM shop_requests sr
       JOIN users u ON sr.user_id = u.user_id
       WHERE sr.request_id = $1`,
      [id]
    );

    if (reqResult.rows.length === 0) {
      return res.status(404).json({ message: "Shop request not found." });
    }

    const r = reqResult.rows[0];

    if (r.status === "approved") {
      return res.status(409).json({
        message: "Cannot reject an already approved request.",
      });
    }

    if (r.status === "rejected") {
      return res.status(409).json({ message: "Request already rejected." });
    }

    //  Step 2: UPDATE status 
    await masterPool.query(
      `UPDATE shop_requests SET status = 'rejected' WHERE request_id = $1`,
      [id]
    );

    //  Step 3: Send rejection email 
    try {
      await sendRejectionEmail(r.user_email, r.user_name, r.shop_name, reason || null);
    } catch (emailErr) {
      console.error("[SHOP-REQUESTS] Rejection email failed:", emailErr.message);
    }

    console.log(`[SHOP-REQUESTS] ✅ Rejected request_id=${id}`);

    return res.json({ message: "Shop request rejected. User has been notified." });

  } catch (error) {
    console.error("[SHOP-REQUESTS] rejectShopRequest error:", error.message);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
};