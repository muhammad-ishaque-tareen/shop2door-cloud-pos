exports.getProducts = async (req, res) => {
  const result = await req.shopDB.query(
    "SELECT * FROM products ORDER BY created_at DESC"
  );
  res.json(result.rows);
};
