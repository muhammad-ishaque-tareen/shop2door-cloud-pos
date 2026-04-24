const express = require("express");
const cors = require("cors");
const path = require('path');
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const salesRoutes = require('./routes/sales.routes');
const userRoutes = require('./routes/user.routes');
const shopRoutes = require('./routes/shop.routes'); 



const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const uploadsPath = path.join(__dirname, '..', 'uploads');


app.use('/uploads', express.static(uploadsPath));


app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shop', shopRoutes); 


app.use('/api/stores',  require('./routes/store.routes'));
app.use('/api/system', require('./routes/system.routes'));
app.use('/api/shop-requests', require('./routes/shoprequest.routes'));
app.use('/api/manage-shops', require('./routes/manageshops.routes'));
app.use('/api/packages', require('./routes/packages.routes'));
app.use('/api/subscriptions', require('./routes/subscriptions.routes'));
app.use('/api/shopusers', require('./routes/shopusers.routes'));
app.use('/api/shopproducts', require('./routes/shopproducts.routes'));
app.use('/api/categories', require('./routes/categories.routes'));


module.exports = app;