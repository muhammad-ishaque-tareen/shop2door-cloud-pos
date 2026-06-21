// Single IndexedDB database for offline POS support.
// Two object stores:
//   - products_cache : read-only mirror of /api/products, refreshed on every
//                       successful online load. Used only when offline.
//   - pending_sales   : write queue for sales made while offline (or while a
//                       sale request failed mid-flight). Synced in order
//                       once connectivity returns.

import { openDB } from 'idb';

const DB_NAME = 'shop2door_offline';
const DB_VERSION = 1;

let dbPromise = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products_cache')) {
          db.createObjectStore('products_cache', { keyPath: 'product_id' });
        }
        if (!db.objectStoreNames.contains('pending_sales')) {
          // client_sale_id is the key — guarantees no duplicate queue entries
          // even if addToCart -> completeSale fires twice for the same UUID.
          db.createObjectStore('pending_sales', { keyPath: 'client_sale_id' });
        }
      },
    });
  }
  return dbPromise;
};


/*  PRODUCTS CACHE     */

// Full replace, not partial merge. See reasoning: the products endpoint
// has no updated_at/version column, so a delta sync would need backend
// changes we don't have yet. A full replace is one clean atomic transaction
// and is plenty fast for a few hundred/thousand SKUs.
export const replaceProductsCache = async (products) => {
  const db = await getDB();
  const tx = db.transaction('products_cache', 'readwrite');
  const store = tx.objectStore('products_cache');
  await store.clear();

  // Only store the fields the offline POS screen actually renders —
  // keeps the cache small and avoids storing stale descriptions / timestamps.
  for (const p of products) {
    await store.put({
      product_id: p.product_id,
      name: p.name,
      barcode: p.barcode || null,
      price: parseFloat(p.price) || 0,
      stock: parseInt(p.stock) || 0,
      unit: p.unit || null,
      category_name: p.category_name || null,
      image_url: p.image_url || null,
    });
  }
  await tx.done;
};

export const getCachedProducts = async () => {
  const db = await getDB();
  return db.getAll('products_cache');
};

// Called optimistically right after a sale is queued/sent, so the cashier's
// next sale (while still offline) sees decremented stock instead of selling
// past zero on a phantom cached number.
export const decrementCachedStock = async (items) => {
  const db = await getDB();
  const tx = db.transaction('products_cache', 'readwrite');
  const store = tx.objectStore('products_cache');
  for (const item of items) {
    const product = await store.get(item.product_id);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
      await store.put(product);
    }
  }
  await tx.done;
};

/*  PENDING SALES QUEUE    */

export const savePendingSale = async (saleRecord) => {
  const db = await getDB();
  // saleRecord = { client_sale_id, saleData, created_at, sync_status, retry_count }
  await db.put('pending_sales', saleRecord);
};

export const getAllPendingSales = async () => {
  const db = await getDB();
  const all = await db.getAll('pending_sales');
  // Oldest first — sales must sync in the order they happened.
  return all.sort((a, b) => a.created_at - b.created_at);
};

export const getPendingSalesCount = async () => {
  const db = await getDB();
  return db.count('pending_sales');
};

export const updatePendingSaleStatus = async (client_sale_id, sync_status, retry_count) => {
  const db = await getDB();
  const record = await db.get('pending_sales', client_sale_id);
  if (!record) return;
  record.sync_status = sync_status;
  record.retry_count = retry_count;
  await db.put('pending_sales', record);
};

export const deletePendingSale = async (client_sale_id) => {
  const db = await getDB();
  await db.delete('pending_sales', client_sale_id);
};