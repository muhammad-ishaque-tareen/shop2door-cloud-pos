const { Pool } = require("pg");

const masterPool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.MASTER_DB_NAME, // was hardcoded "master_db"
  port: process.env.DB_PORT,
});

module.exports = masterPool;