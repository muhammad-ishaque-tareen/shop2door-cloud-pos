const express = require("express");
const cors = require("cors");
const path = require('path');
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const salesRoutes = require('./routes/sales.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
const uploadsPath = path.join(__dirname, '..', 'uploads');

app.use('/uploads', express.static(uploadsPath));
app.get('/test-upload', (req, res) => {
  const fs = require('fs');
  const testPath = path.join(__dirname, '..', 'uploads', 'products');
  
  fs.readdir(testPath, (err, files) => {
    if (err) {
      return res.json({ error: err.message, path: testPath });
    }
    res.json({ 
      message: 'Uploads directory found!',
      path: testPath,
      files: files 
    });
  });
});
app.use('/api/sales/my', (req, res, next) => {
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use('/api/sales', salesRoutes);

app.use('/api/users', userRoutes);

module.exports = app;
