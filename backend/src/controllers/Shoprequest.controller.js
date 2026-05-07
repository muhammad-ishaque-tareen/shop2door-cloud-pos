const { Pool }   = require("pg");
const masterPool = require("../db/master.pool");
const nodemailer = require("nodemailer");
const bcrypt     = require("bcrypt");

//  Mailer 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

//  Helpers 
const generateShopCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code    = "S2D-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateDbName = () => `shop_${Date.now()}`;

const getUniqueCode = async (client) => {
  let code;
  let exists = true;
  while (exists) {
    code         = generateShopCode();
    const check  = await client.query(
      "SELECT shop_id FROM shops WHERE code = $1",
      [code]
    );
    exists = check.rows.length > 0;
  }
  return code;
};

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

const createPool = (database) =>
  new Pool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 5432,
    database,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

//  Email: Approval 
const sendApprovalEmail = async (
  toEmail, toName, shopName, shopCode, tempPassword, isFreeTrial, trialEndDate
) => {
  const trialNote = isFreeTrial
    ? `
      <div style="background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 6px 6px 0;
                  padding:12px 16px;margin:16px 0;">
        <p style="color:#15803d;font-size:13px;font-weight:600;margin:0 0 4px;">
          🎉 Your 7-Day Free Trial Has Started!
        </p>
        <p style="color:#166534;font-size:13px;margin:0;">
          Your trial runs until <strong>${new Date(trialEndDate).toDateString()}</strong>.
          You will receive reminder emails on days 5, 6, and 7.
          After the trial, you have 3 days to upgrade before your account is removed.
        </p>
      </div>`
    : "";

  await transporter.sendMail({
    from: `"Shop2Door" <${process.env.EMAIL_USER}>`,
    to:   toEmail,
    subject: "🎉 Your Shop2Door Account is Approved!",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f9f9f9;padding:40px 32px;">
        <div style="max-width:520px;margin:0 auto;">
          <div style="margin-bottom:24px;">
            <span style="font-size:22px;font-weight:700;color:#9c27b0;letter-spacing:-0.5px;">Shop2Door</span>
          </div>
          <h2 style="color:#1f2937;font-size:20px;font-weight:600;margin:0 0 4px;">
            Congratulations, ${toName}!
          </h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">
            You're officially part of the Shop2Door family.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
            Your shop <strong>${shopName}</strong> has been approved and is now live.
            Here are your login credentials:
          </p>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;
                      padding:20px 24px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#9ca3af;font-weight:600;width:42%;">Login Email</td>
                <td style="padding:10px 0;color:#374151;">${toEmail}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#9ca3af;font-weight:600;">Temporary Password</td>
                <td style="padding:10px 0;font-family:monospace;font-size:15px;
                           color:#9c27b0;font-weight:700;letter-spacing:1px;">${tempPassword}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9ca3af;font-weight:600;">Shop Code</td>
                <td style="padding:10px 0;font-family:monospace;font-size:15px;
                           color:#059669;font-weight:700;letter-spacing:1px;">${shopCode}</td>
              </tr>
            </table>
          </div>
          ${trialNote}
          <div style="background:#fef3c7;border-left:3px solid #f59e0b;border-radius:0 6px 6px 0;
                      padding:10px 14px;margin-bottom:16px;">
            <p style="color:#92400e;font-size:13px;font-weight:600;margin:0;">
              ⚠️ Please log in and change your password immediately.
            </p>
          </div>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;">
            Share the <strong style="color:#374151;">Shop Code</strong> with your
            Store Managers and Cashiers. They need it to log in.
          </p>
          <div style="border-top:1px solid #e5e7eb;margin-top:28px;padding-top:20px;">
            <p style="color:#6b7280;font-size:13px;margin:0 0 6px;">Need help?</p>
            <a href="mailto:info.shop2door@gmail.com"
               style="display:inline-block;background:#f3e8ff;color:#7e22ce;font-size:13px;
                      font-weight:600;padding:8px 16px;border-radius:6px;
                      text-decoration:none;border:1px solid #d8b4fe;">
              info.shop2door@gmail.com
            </a>
            <p style="color:#d1d5db;font-size:11px;margin:16px 0 0;">
              © 2026 SHOP2DOOR. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
  });
};

//  Email: Rejection 
const sendRejectionEmail = async (toEmail, toName, shopName, reason) => {
  await transporter.sendMail({
    from: `"Shop2Door" <${process.env.EMAIL_USER}>`,
    to:   toEmail,
    subject: "Shop2Door — Shop Request Update",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f9f9f9;padding:40px 32px;">
        <div style="max-width:520px;margin:0 auto;">
          <div style="margin-bottom:24px;">
            <span style="font-size:22px;font-weight:700;color:#9c27b0;letter-spacing:-0.5px;">Shop2Door</span>
          </div>
          <h2 style="color:#1f2937;font-size:20px;font-weight:600;margin:0 0 4px;">Hello, ${toName}</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">An update on your shop request</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
            We're sorry to inform you that your shop request for
            <strong>${shopName}</strong> could not be approved at this time.
          </p>
          ${reason ? `
          <div style="background:#fef2f2;border-left:3px solid #ef4444;
                      border-radius:0 6px 6px 0;padding:12px 16px;margin:16px 0;">
            <p style="color:#dc2626;font-size:13px;font-weight:600;margin:0 0 4px;">
              Reason for rejection
            </p>
            <p style="color:#991b1b;font-size:13px;margin:0;">${reason}</p>
          </div>` : ""}
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:16px 0;">
            Please verify your details and contact our support team to resubmit.
          </p>
          <div style="border-top:1px solid #e5e7eb;margin-top:28px;padding-top:20px;">
            <a href="mailto:info.shop2door@gmail.com"
               style="display:inline-block;background:#f3e8ff;color:#7e22ce;font-size:13px;
                      font-weight:600;padding:8px 16px;border-radius:6px;
                      text-decoration:none;border:1px solid #d8b4fe;">
              info.shop2door@gmail.com
            </a>
            <p style="color:#d1d5db;font-size:11px;margin:16px 0 0;">
              © 2026 SHOP2DOOR. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
  });
};

// GET /api/shop-requests
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

// POST /api/shop-requests/:id/approve
exports.approveShopRequest = async (req, res) => {
  const { id }   = req.params;
  const client   = await masterPool.connect();
  let committed  = false;

  try {
    await client.query("BEGIN");

    // Step 1: Fetch shop_request + user + package
    const reqResult = await client.query(
      `SELECT
         sr.*,
         u.name     AS user_name,
         u.email    AS user_email,
         u.password AS user_password,
         pk.price   AS package_price
       FROM shop_requests sr
       JOIN users    u  ON sr.user_id    = u.user_id
       JOIN packages pk ON sr.package_id = pk.package_id
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

    // Detect free trial
    const isFreeTrial = parseFloat(r.package_price) === 0;

    // Step 2: Generate unique shop code & db name
    const shopCode = await getUniqueCode(client);
    const dbName   = generateDbName();

    // Step 3: INSERT into shops
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

    // Step 4: UPDATE users
    await client.query(
      `UPDATE users SET shop_id = $1, package_id = $2 WHERE user_id = $3`,
      [shopId, r.package_id, r.user_id]
    );

    // Step 5: INSERT into subscriptions
    // Free trial → 7 days | Paid → 1 year
    const subscriptionInterval = isFreeTrial
      ? "INTERVAL '7 days'"
      : "INTERVAL '1 month'";

   await client.query(
      `INSERT INTO subscriptions
         (shop_id, package_id, start_date, end_date, status, is_free_trial, trial_end_date)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + ${subscriptionInterval}, 'active', $3, $4)`,
      [
        shopId,
        r.package_id,
        isFreeTrial,
        isFreeTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
      ]
    );
    // Step 6: INSERT into usage
    await client.query(
      `INSERT INTO usage
         (shop_id, users_used, stores_used, products_used, storage_used)
       VALUES ($1, 0, 0, 0, 0)`,
      [shopId]
    );

    // Step 7: INSERT into payments
    // Free trial: method='free_trial', amount=0
    await client.query(
      `INSERT INTO payments
         (user_id, shop_id, package_id, payment_method, sender_account,
          transaction_ref, amount, payment_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved')`,
      [
        r.user_id,
        shopId,
        r.package_id,
        isFreeTrial ? "free_trial"    : r.payment_method,
        isFreeTrial ? "N/A"           : r.sender_account,
        isFreeTrial ? "FREE-TRIAL"    : r.transaction_ref,
        isFreeTrial ? 0               : r.amount,
        isFreeTrial ? new Date()      : r.payment_date,
      ]
    );

    // Step 8: UPDATE shop_requests status = 'approved'
    await client.query(
      `UPDATE shop_requests SET status = 'approved' WHERE request_id = $1`,
      [id]
    );

    await client.query("COMMIT");
    committed = true;

    // Phase 2: CREATE DATABASE
    const adminPool   = createPool("postgres");
    const adminClient = await adminPool.connect();
    try {
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[SHOP-REQUESTS] ✅ Created database: ${dbName}`);
    } finally {
      adminClient.release();
      await adminPool.end();
    }

    // Phase 3: CREATE tables in new DB
    const shopPool   = createPool(dbName);
    const shopClient = await shopPool.connect();
    try {
      await shopClient.query(buildShopTablesSql());
      console.log(`[SHOP-REQUESTS] ✅ Created tables in: ${dbName}`);
    } finally {
      shopClient.release();
      await shopPool.end();
    }

    // Phase 4: Temp password + email
    const tempPassword = "Shop@" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const hashedTemp   = await bcrypt.hash(tempPassword, 12);

    await masterPool.query(
      `UPDATE users SET password = $1 WHERE user_id = $2`,
      [hashedTemp, r.user_id]
    );

    // Get trial end date for the email
    let trialEndDate = null;
    if (isFreeTrial) {
      const subRow = await masterPool.query(
        `SELECT end_date FROM subscriptions
         WHERE shop_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [shopId]
      );
      trialEndDate = subRow.rows[0]?.end_date;
    }

    try {
      await sendApprovalEmail(
        r.user_email,
        r.user_name,
        r.shop_name,
        shopCode,
        tempPassword,
        isFreeTrial,
        trialEndDate
      );
    } catch (emailErr) {
      console.error("[SHOP-REQUESTS] Approval email failed:", emailErr.message);
    }

    console.log(
      `[SHOP-REQUESTS] ✅ Approved request_id=${id} → shop_id=${shopId}` +
      ` db="${dbName}" code="${shopCode}" free_trial=${isFreeTrial}`
    );

    return res.json({
      message:       "Shop approved successfully. Credentials sent to shop admin.",
      shop_id:       shopId,
      db_name:       dbName,
      code:          shopCode,
      is_free_trial: isFreeTrial,
    });

  } catch (error) {
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

// POST /api/shop-requests/:id/reject
exports.rejectShopRequest = async (req, res) => {
  const { id }     = req.params;
  const { reason } = req.body || {};

  try {
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

    await masterPool.query(
      `UPDATE shop_requests SET status = 'rejected' WHERE request_id = $1`,
      [id]
    );

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