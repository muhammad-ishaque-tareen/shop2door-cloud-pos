const { Pool } = require("pg");

const pools = {};

const EVICTION_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;      // Evict pools idle >= 10 minutes

/**
 * Periodically evicts pools that have been idle for >= 10 minutes.
 * Ensures pools with active or queued connections are never evicted mid-use.
 */
const evictIdlePools = () => {
  const now = Date.now();
  for (const dbName of Object.keys(pools)) {
    const pool = pools[dbName];
    if (!pool) continue;

    // Check if the pool is currently mid-use:
    // 1. Any active checkouts tracked via acquire/release
    // 2. Any active (non-idle) clients inside pg.Pool
    // 3. Any requests queued waiting for a client
    const hasActiveClients = (pool._activeClients || 0) > 0;
    const hasCheckedOutClients = (pool.totalCount - pool.idleCount) > 0;
    const hasWaitingClients = (pool.waitingCount || 0) > 0;

    if (hasActiveClients || hasCheckedOutClients || hasWaitingClients) {
      continue;
    }

    const idleTime = now - (pool._lastUsed || now);
    if (idleTime >= IDLE_TIMEOUT_MS) {
      delete pools[dbName];
      pool.end().catch((err) => {
        console.error(`[SHOP POOL] Error ending evicted pool for ${dbName}:`, err.message);
      });
      console.log(`[SHOP POOL] Evicted idle pool for "${dbName}" (idle for ${Math.round(idleTime / 1000)}s)`);
    }
  }
};

const evictionTimer = setInterval(evictIdlePools, EVICTION_INTERVAL_MS);
evictionTimer.unref();

const cleanup = () => {
  clearInterval(evictionTimer);
  for (const dbName of Object.keys(pools)) {
    const pool = pools[dbName];
    delete pools[dbName];
    if (pool) {
      pool.end().catch(() => {});
    }
  }
};

process.once("SIGTERM", cleanup);
process.once("SIGINT", cleanup);

/**
 * Returns a connection pool for the specified tenant database.
 * Creates a capped pool (max: 3) on the first request and tracks usage.
 *
 * @param {string} dbName - Tenant database name
 * @returns {Pool} pg.Pool instance
 */
const getShopPool = (dbName) => {
  if (!pools[dbName]) {
    const pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      port: process.env.DB_PORT,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool._lastUsed = Date.now();
    pool._activeClients = 0;

    pool.on("acquire", () => {
      pool._lastUsed = Date.now();
      pool._activeClients = (pool._activeClients || 0) + 1;
    });

    pool.on("release", () => {
      pool._lastUsed = Date.now();
      pool._activeClients = Math.max(0, (pool._activeClients || 1) - 1);
    });

    pool.on("error", (err) => {
      console.error(`[SHOP POOL ERROR] ${dbName}:`, err.message);
    });

    // Also wrap pool.query to update _lastUsed on every query execution
    const originalQuery = pool.query.bind(pool);
    pool.query = (...args) => {
      pool._lastUsed = Date.now();
      return originalQuery(...args);
    };

    pools[dbName] = pool;
  }

  pools[dbName]._lastUsed = Date.now();
  return pools[dbName];
};

getShopPool.pools = pools;
getShopPool.evictIdlePools = evictIdlePools;

module.exports = getShopPool;
