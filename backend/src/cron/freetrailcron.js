const cron       = require("node-cron");
const masterPool = require("../db/master.pool");
const { Pool }   = require("pg");
const {
  sendTrialReminderEmail,
  sendDeletionWarningEmail,
} = require("../controllers/freetrail.controller");

//  Drop the shop database permanently 
async function dropShopDatabase(dbName) {
  if (!dbName) return;
  // Connect to postgres (maintenance DB) to drop
  const adminPool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres",
  });
  try {
    // Terminate all connections to the target DB first
    await adminPool.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName]
    );
    // Drop it — use identifier quoting to prevent injection
    await adminPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    console.log(`[CRON] Dropped shop database: ${dbName}`);
  } catch (err) {
    console.error(`[CRON] Failed to drop DB ${dbName}:`, err.message);
  } finally {
    await adminPool.end();
  }
}

//  Main cron logic 
async function runFreeTrailCron() {
  console.log("[CRON] Free-trial job running at", new Date().toISOString());

  try {
    // Fetch all active free-trial subscriptions with user + shop info
    const { rows } = await masterPool.query(`
      SELECT
        sub.subscription_id,
        sub.shop_id,
        sub.trial_end_date,
        sub.status,
        s.db_name,
        s.name          AS shop_name,
        u.user_id,
        u.name          AS user_name,
        u.email         AS user_email,
        u.is_disabled
      FROM subscriptions sub
      JOIN shops   s ON s.shop_id   = sub.shop_id
      JOIN users   u ON u.shop_id   = sub.shop_id AND u.role = 'shop_admin'
      WHERE sub.is_free_trial = true
    `);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const row of rows) {
      const trialEnd = new Date(row.trial_end_date);
      trialEnd.setHours(0, 0, 0, 0);

      // daysLeft: positive = still in trial, 0 = expires today, negative = already expired
      const diffMs   = trialEnd - today;
      const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

      //  DURING TRIAL 
      // Send reminder on day 5, 6, 7 (i.e. 3 days left, 2 days left, last day)
      if (daysLeft === 3 || daysLeft === 2 || daysLeft === 1) {
        try {
          await sendTrialReminderEmail({
            to:        row.user_email,
            name:      row.user_name,
            shopName:  row.shop_name,
            daysLeft,
            isLastDay: daysLeft === 1,
          });
          console.log(
            `[CRON] Trial reminder sent → ${row.user_email} (${daysLeft} days left)`
          );
        } catch (mailErr) {
          console.error("[CRON] Reminder email error:", mailErr.message);
        }
      }

      //  TRIAL JUST EXPIRED (daysLeft === 0) 
      // Disable account and mark subscription as expired
      if (daysLeft === 0) {
        await masterPool.query(
          `UPDATE users SET is_disabled = true WHERE user_id = $1`,
          [row.user_id]
        );
        await masterPool.query(
          `UPDATE subscriptions SET status = 'expired' WHERE subscription_id = $1`,
          [row.subscription_id]
        );
        try {
          await sendDeletionWarningEmail({
            to:               row.user_email,
            name:             row.user_name,
            shopName:         row.shop_name,
            daysUntilDeletion: 3,
          });
          console.log(`[CRON] Trial expired + disabled → ${row.user_email}`);
        } catch (mailErr) {
          console.error("[CRON] Expiry email error:", mailErr.message);
        }
      }

      //  GRACE PERIOD: day 1 and 2 after expiry (daysLeft === -1, -2) 
      // Send daily deletion warnings
      if (daysLeft === -1 || daysLeft === -2) {
        const daysUntilDeletion = daysLeft === -1 ? 2 : 1;
        try {
          await sendDeletionWarningEmail({
            to:               row.user_email,
            name:             row.user_name,
            shopName:         row.shop_name,
            daysUntilDeletion,
          });
          console.log(
            `[CRON] Deletion warning sent → ${row.user_email} (deletes in ${daysUntilDeletion} days)`
          );
        } catch (mailErr) {
          console.error("[CRON] Warning email error:", mailErr.message);
        }
      }

      //  DAY 4 AFTER EXPIRY: PERMANENT DELETION 
      // daysLeft === -3 means trial ended 3 days ago → delete on 4th day after expiry
      if (daysLeft <= -3) {
        console.log(
          `[CRON] Deleting expired trial account: ${row.user_email} | Shop: ${row.shop_name}`
        );

        const client = await masterPool.connect();
        try {
          await client.query("BEGIN");

          // 1. Save email in freetrail_users so it can never be reused
          await client.query(
            `INSERT INTO freetrail_users (email)
             VALUES ($1)
             ON CONFLICT (email) DO NOTHING`,
            [row.user_email]
          );

          // 2. Delete shop_requests linked to this user
          await client.query(
            `DELETE FROM shop_requests WHERE user_id = $1`,
            [row.user_id]
          );

          // 3. Delete usage record
          await client.query(
            `DELETE FROM usage WHERE shop_id = $1`,
            [row.shop_id]
          );

          // 4. Delete subscriptions
          await client.query(
            `DELETE FROM subscriptions WHERE shop_id = $1`,
            [row.shop_id]
          );

          // 5. Delete payments
          await client.query(
            `DELETE FROM payments WHERE shop_id = $1`,
            [row.shop_id]
          );

          // 6. Delete the user
          await client.query(
            `DELETE FROM users WHERE user_id = $1`,
            [row.user_id]
          );

          // 7. Delete the shop
          await client.query(
            `DELETE FROM shops WHERE shop_id = $1`,
            [row.shop_id]
          );

          await client.query("COMMIT");

          // 8. Drop the shop database (outside transaction — DDL cannot be rolled back)
          await dropShopDatabase(row.db_name);

          // 9. Send final deletion notification
          try {
            await sendDeletionWarningEmail({
              to:               row.user_email,
              name:             row.user_name,
              shopName:         row.shop_name,
              daysUntilDeletion: 0, // triggers "deleted" message
            });
          } catch (mailErr) {
            console.error("[CRON] Final deletion email error:", mailErr.message);
          }

          console.log(
            `[CRON] ✅ Deleted account & shop for: ${row.user_email}`
          );
        } catch (txErr) {
          await client.query("ROLLBACK");
          console.error("[CRON] Deletion transaction failed:", txErr.message);
        } finally {
          client.release();
        }
      }
    }
  } catch (err) {
    console.error("[CRON] freeTrailCron fatal error:", err.message);
  }
}

//  Export: starts the cron, called from app.js 
module.exports = function startFreeTrailCron() {
  // Run every day at 08:00 AM server time
  cron.schedule("0 8 * * *", runFreeTrailCron);
  console.log("[CRON] Free-trial cron scheduled: daily at 08:00 AM");
};