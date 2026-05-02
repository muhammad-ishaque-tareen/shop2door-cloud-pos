const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const masterPool = require("../db/master.pool");
const getShopPool = require("../db/shop.pool");

//  Multer setup 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/users");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()))
      cb(null, true);
    else
      cb(new Error("Only JPEG, PNG and WebP images are allowed"));
  },
});

exports.uploadProfileImage = upload.single("image");

//  Helper: resolve the correct pool for the requesting user 
// Rule:
//   system_admin  → masterPool  (no db_name needed)
//   shop_admin    → masterPool  (their record lives in platformDB)
//   store_manager → shopPool    (their record lives in the shop's own DB)
//   cashier       → shopPool    (their record lives in the shop's own DB)
const SHOP_ROLES = ["store_manager", "cashier"];

function resolvePool(role, db_name) {
  if (SHOP_ROLES.includes(role)) {
    if (!db_name)
      throw new Error(
        "db_name is missing from token for role: " + role
      );
    return getShopPool(db_name);
  }
  return masterPool;
}

//  GET /api/users/me 
exports.getMyProfile = async (req, res) => {
  const { id: userId, role, db_name } = req.user;

  try {
    const pool = resolvePool(role, db_name);

    const result = await pool.query(
      `SELECT user_id, name, email, phone, role, image_url, created_at
       FROM users
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error("[USER] getMyProfile error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

//  PUT /api/users/update-profile 
exports.updateProfile = async (req, res) => {
  const { name, phone, password } = req.body;
  const { id: userId, role, db_name } = req.user;

  const image_url = req.file
    ? `/uploads/users/${req.file.filename}`
    : undefined;

  try {
    const pool = resolvePool(role, db_name);

    const setClauses = [];
    const params     = [];

    if (name  !== undefined && name  !== null) {
      params.push(name);
      setClauses.push(`name = $${params.length}`);
    }

    if (phone !== undefined && phone !== null) {
      params.push(phone);
      setClauses.push(`phone = $${params.length}`);
    }

    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      params.push(hashed);
      setClauses.push(`password = $${params.length}`);
    }

    if (image_url !== undefined) {
      params.push(image_url);
      setClauses.push(`image_url = $${params.length}`);
    }

    if (setClauses.length === 0)
      return res.status(400).json({ message: "No fields to update" });

    params.push(userId);
    const query = `
      UPDATE users
      SET ${setClauses.join(", ")}
      WHERE user_id = $${params.length}
      RETURNING user_id, name, email, phone, role, image_url
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully", user: result.rows[0] });

  } catch (error) {
    console.error("[USER] updateProfile error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};