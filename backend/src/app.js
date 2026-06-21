const express            = require("express");
const cors               = require("cors");
const path               = require("path");
const startFreeTrailCron = require("./cron/freetrailcron");  

const authRoutes    = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const salesRoutes   = require("./routes/sales.routes");
const userRoutes    = require("./routes/user.routes");
const shopRoutes    = require("./routes/shop.routes");

const app = express();

app.use(cors({
  origin:      "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

const uploadsPath = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsPath));

// Health check — used by the frontend's offline-sync heartbeat to confirm
// the server is actually reachable, not just that the network adapter is up.
// No auth required: it must respond even if the client's token is missing
// or expired, since that's exactly the kind of state we're checking for.
app.get("/api/health", (req, res) => res.sendStatus(200));

// Core routes
app.use("/api/auth",     authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales",    salesRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/shop",     shopRoutes);

// Feature routes
app.use("/api/stores",               require("./routes/store.routes"));
app.use("/api/system",               require("./routes/system.routes"));
app.use("/api/shop-requests",        require("./routes/shoprequest.routes"));
app.use("/api/manage-shops",         require("./routes/manageshops.routes"));
app.use("/api/packages",             require("./routes/packages.routes"));
app.use("/api/subscriptions",        require("./routes/subscriptions.routes"));
app.use("/api/shopusers",            require("./routes/shopusers.routes"));
app.use("/api/shopproducts",         require("./routes/shopproducts.routes"));
app.use("/api/categories",           require("./routes/categories.routes"));
app.use("/api/inventory",            require("./routes/inventory.routes"));
app.use("/api/salesrecords",         require("./routes/salesrecords.routes"));
app.use("/api/reportsandanalytics",  require("./routes/reportsandanalytics.routes"));
app.use("/api/suppliers",            require("./routes/suppliers.routes"));
app.use("/api/signup",               require("./routes/signup.routes"));
app.use("/api/shopsetup",            require("./routes/shopsetup.routes"));
app.use("/api/freetrail",            require("./routes/freetrail.routes"));  

// Start cron jobs
startFreeTrailCron();   

module.exports = app;