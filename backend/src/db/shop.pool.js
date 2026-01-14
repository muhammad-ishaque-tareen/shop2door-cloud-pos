const { Pool } = require("pg");

const pools = {};

module.exports = (dbName) => {
  if (!pools[dbName]) {
    pools[dbName] = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      port: process.env.DB_PORT,
    });
  }
  return pools[dbName];
};
