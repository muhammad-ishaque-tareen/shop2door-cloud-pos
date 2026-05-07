// controllers/freetrail.controller.js

const masterPool  = require("../db/master.pool");
const nodemailer  = require("nodemailer");

//  Shared transporter 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

//  GET /api/freetrail/check-status 
// Called after login for shop_admin role.
// Returns trial status so frontend can redirect to the wall page if expired.
exports.checkTrialStatus = async (req, res) => {
  const shopId = req.user?.shop_id;

  if (!shopId) {
    return res.json({ status: "no_shop", isFreeTrial: false });
  }

  try {
    const result = await masterPool.query(
      `SELECT
         sub.subscription_id,
         sub.is_free_trial,
         sub.trial_end_date,
         sub.end_date,
         sub.status,
         pk.name AS package_name
       FROM subscriptions sub
       JOIN packages pk ON pk.package_id = sub.package_id
       WHERE sub.shop_id = $1
       ORDER BY sub.created_at DESC
       LIMIT 1`,
      [shopId]
    );

    if (result.rows.length === 0) {
      return res.json({ status: "no_subscription", isFreeTrial: false });
    }

    const sub = result.rows[0];

    if (!sub.is_free_trial) {
      return res.json({ status: "paid", isFreeTrial: false });
    }

    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const trialEnd = new Date(sub.trial_end_date);
    trialEnd.setHours(0, 0, 0, 0);
    const diffMs   = trialEnd - today;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft > 0) {
      return res.json({
        status:       "trial_active",
        isFreeTrial:  true,
        daysLeft,
        trialEndDate: sub.trial_end_date,
      });
    } else {
      // Trial is expired — check if account is disabled
      const userCheck = await masterPool.query(
        `SELECT is_disabled FROM users WHERE user_id = $1`,
        [req.user.id]
      );
      const isDisabled = userCheck.rows[0]?.is_disabled || false;

      return res.json({
        status:       "trial_expired",
        isFreeTrial:  true,
        daysLeft:     0,
        trialEndDate: sub.trial_end_date,
        isDisabled,
      });
    }
  } catch (error) {
    console.error("[FREE-TRIAL] checkTrialStatus error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// Called in ShopSetup before allowing free trial selection.
// Checks the permanent freetrail_users table so one email = one trial ever.
exports.checkEmailUsed = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "email query param is required" });
  }

  try {
    const result = await masterPool.query(
      `SELECT id FROM freetrail_users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    return res.json({ alreadyUsed: result.rows.length > 0 });
  } catch (error) {
    console.error("[FREE-TRIAL] checkEmailUsed error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

//  Internal helper: send trial reminder email 
async function sendTrialReminderEmail({ to, name, daysLeft, shopName, isLastDay }) {
  const subject = isLastDay
    ? `⚠️ Last Day! Your Shop2Door Free Trial Ends Today`
    : `⏰ Free Trial Reminder — ${daysLeft} day${daysLeft > 1 ? "s" : ""} left`;

  const urgencyColor  = daysLeft <= 1 ? "#dc2626" : daysLeft <= 2 ? "#f59e0b" : "#7e22ce";
  const urgencyText   = isLastDay
    ? "Today is the last day of your free trial."
    : `Your free trial expires in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>.`;

  await transporter.sendMail({
    from: `"Shop2Door" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f9f9f9;padding:40px 32px;">
        <div style="max-width:500px;margin:0 auto;">
          <div style="margin-bottom:20px;">
            <span style="font-size:22px;font-weight:700;color:#9c27b0;">Shop2Door</span>
          </div>
          <h2 style="color:#1f2937;font-size:20px;margin:0 0 8px;">Hello, ${name} 👋</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">
            ${urgencyText} Upgrade to a paid plan to keep your shop <strong>${shopName}</strong> running without interruption.
          </p>
          <div style="background:#fff;border:2px solid ${urgencyColor};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="font-size:36px;font-weight:800;color:${urgencyColor};margin:0;">
              ${isLastDay ? "TODAY" : `${daysLeft} Day${daysLeft > 1 ? "s" : ""}`}
            </p>
            <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">remaining on your free trial</p>
          </div>
          <div style="background:#fef3c7;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
            <p style="color:#92400e;font-size:13px;font-weight:600;margin:0;">
              ⚠️ After your trial ends, you will have a 3-day grace period to upgrade. On day 4, your account and shop data will be permanently deleted.
            </p>
          </div>
          <a href="http://localhost:5173/subscription"
             style="display:inline-block;background:#7e22ce;color:#fff;font-weight:700;font-size:15px;
                    padding:14px 32px;border-radius:8px;text-decoration:none;margin-bottom:24px;">
            Upgrade Now →
          </a>
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              Need help? Contact us at
              <a href="mailto:info.shop2door@gmail.com" style="color:#7e22ce;">info.shop2door@gmail.com</a>
            </p>
            <p style="color:#d1d5db;font-size:11px;margin:8px 0 0;">© 2026 SHOP2DOOR. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  });
}

//  Internal helper: send post-expiry deletion warning email 
async function sendDeletionWarningEmail({ to, name, shopName, daysUntilDeletion }) {
  const isDeleteDay = daysUntilDeletion <= 0;
  const subject     = isDeleteDay
    ? `🚨 Shop2Door — Your account has been deleted`
    : `🚨 Urgent: Account deletion in ${daysUntilDeletion} day${daysUntilDeletion > 1 ? "s" : ""}`;

  await transporter.sendMail({
    from: `"Shop2Door" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f9f9f9;padding:40px 32px;">
        <div style="max-width:500px;margin:0 auto;">
          <div style="margin-bottom:20px;">
            <span style="font-size:22px;font-weight:700;color:#9c27b0;">Shop2Door</span>
          </div>
          <h2 style="color:#dc2626;font-size:20px;margin:0 0 8px;">
            ${isDeleteDay ? "Your account has been deleted" : `Account Deletion Warning — ${daysUntilDeletion} Day${daysUntilDeletion > 1 ? "s" : ""} Left`}
          </h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">
            Hello ${name}, your free trial for <strong>${shopName}</strong> has expired.
            ${isDeleteDay
              ? "As we informed you, your account and all shop data have now been permanently deleted."
              : `Your account and all associated shop data will be <strong>permanently deleted in ${daysUntilDeletion} day${daysUntilDeletion > 1 ? "s" : ""}</strong> if you do not upgrade.`
            }
          </p>
          ${!isDeleteDay ? `
          <a href="http://localhost:5173/subscription"
             style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;font-size:15px;
                    padding:14px 32px;border-radius:8px;text-decoration:none;margin-bottom:24px;">
            Upgrade Immediately →
          </a>` : ""}
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 SHOP2DOOR. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  });
}

// Export helpers so the cron can use them
exports.sendTrialReminderEmail   = sendTrialReminderEmail;
exports.sendDeletionWarningEmail = sendDeletionWarningEmail;