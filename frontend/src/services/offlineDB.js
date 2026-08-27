// Single IndexedDB database for offline POS support.
//
// Object stores:
//   - products_cache : read-only mirror of /api/products, refreshed on every
//                       successful online load. Used only when offline.
//   - pending_sales   : write queue for sales made while offline (or while a
//                       sale request failed mid-flight). Synced in order
//                       once connectivity returns.
//   - sale_id_map     : client_sale_id -> real server sale_id, written the
//                       moment ANY sale gets a server id (immediate online
//                       sale, or a queued sale that just finished syncing).
//                       This is how a queued RETURN for a sale that was
//                       itself unsynced at the time finds its real sale_id
//                       later, without needing another server round-trip.
//   - sales_cache     : slim, offline-searchable copy of recently-seen sales
//                       (by receipt_no), so the Return Product screen can
//                       look a receipt up even with no connection — whether
//                       that sale was fetched live once before, or was just
//                       synced from this device's own queue.
//   - pending_returns : write queue for returns made while offline, or for
//                       returns against a sale that hasn't synced yet.
//                       Synced in order once connectivity returns AND
//                       (if needed) once the underlying sale has synced.

import { openDB } from 'idb';

const DB_NAME = 'shop2door_offline';
const DB_VERSION = 2; // bumped from 1: added sale_id_map, sales_cache, pending_returns

let dbPromise = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('products_cache')) {
          db.createObjectStore('products_cache', { keyPath: 'product_id' });
        }
        if (!db.objectStoreNames.contains('pending_sales')) {
          // client_sale_id is the key — guarantees no duplicate queue entries
          // even if addToCart -> completeSale fires twice for the same UUID.
          db.createObjectStore('pending_sales', { keyPath: 'client_sale_id' });
        }
        if (!db.objectStoreNames.contains('sale_id_map')) {
          db.createObjectStore('sale_id_map', { keyPath: 'client_sale_id' });
        }
        if (!db.objectStoreNames.contains('sales_cache')) {
          db.createObjectStore('sales_cache', { keyPath: 'receipt_no' });
        }
        if (!db.objectStoreNames.contains('pending_returns')) {
          db.createObjectStore('pending_returns', { keyPath: 'client_return_id' });
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

// Mirror of decrementCachedStock, used when a return is queued/processed —
// puts the returned quantity back into the cached stock figure so the next
// offline sale on this device doesn't undersell against a stale number.
export const incrementCachedStock = async (items) => {
  const db = await getDB();
  const tx = db.transaction('products_cache', 'readwrite');
  const store = tx.objectStore('products_cache');
  for (const item of items) {
    const product = await store.get(item.product_id);
    if (product) {
      product.stock = product.stock + item.quantity;
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

/*  SALE ID MAP (client_sale_id -> real server sale_id)   */
// Written the instant a sale gets a server id, whether that happened
// immediately (online) or later (synced from the offline queue). This is
// the bridge that lets a return queued against an unsynced sale find its
// real sale_id once that sale finally syncs.

export const saveSaleIdMapping = async ({ client_sale_id, sale_id, receipt_no }) => {
  const db = await getDB();
  await db.put('sale_id_map', { client_sale_id, sale_id, receipt_no, mapped_at: Date.now() });
};

export const getSaleIdMapping = async (client_sale_id) => {
  const db = await getDB();
  return db.get('sale_id_map', client_sale_id);
};

/*  SALES CACHE (offline receipt lookup for returns)   */

// Full replace of one sale's cached record, keyed by receipt_no. Called:
//   - after a live GET /sales/receipt/:no succeeds (so it's searchable
//     offline next time)
//   - right after any sale gets a real sale_id (online or synced) so a
//     just-made sale is immediately returnable offline
export const cacheSyncedSale = async (saleRecord) => {
  const db = await getDB();
  // saleRecord = {
  //   receipt_no, sale_id, store_id, status,
  //   items: [{ sale_item_id?, product_id, name, quantity, price, already_returned_qty }],
  //   subtotal, tax, discount, total, created_at
  // }
  await db.put('sales_cache', saleRecord);
};

export const getCachedSaleByReceipt = async (receiptNo) => {
  const db = await getDB();
  return db.get('sales_cache', receiptNo);
};

// Bumps already_returned_qty on the cached copy of a sale after a return is
// queued or confirmed, so the offline UI can't let the same items be
// returned twice before the next real sync. Marks the sale 'returned' once
// every line is fully accounted for.
export const updateCachedSaleReturnedQty = async (receiptNo, returnedItems) => {
  const db = await getDB();
  const record = await db.get('sales_cache', receiptNo);
  if (!record) return;

  for (const ret of returnedItems) {
    const line = record.items.find((i) => i.product_id === ret.product_id);
    if (line) {
      line.already_returned_qty = (parseFloat(line.already_returned_qty) || 0) + parseFloat(ret.quantity);
    }
  }

  const fullyReturned = record.items.every(
    (i) => (parseFloat(i.already_returned_qty) || 0) >= parseFloat(i.quantity)
  );
  if (fullyReturned) record.status = 'returned';

  await db.put('sales_cache', record);
};

/*  PENDING RETURNS QUEUE    */

export const savePendingReturn = async (returnRecord) => {
  const db = await getDB();
  // returnRecord = {
  //   client_return_id, sale_id (nullable), client_sale_id (nullable),
  //   receipt_no, reason, items, created_at, sync_status, retry_count
  // }
  await db.put('pending_returns', returnRecord);
};

export const getAllPendingReturns = async () => {
  const db = await getDB();
  const all = await db.getAll('pending_returns');
  return all.sort((a, b) => a.created_at - b.created_at);
};

export const getPendingReturnsCount = async () => {
  const db = await getDB();
  return db.count('pending_returns');
};

export const updatePendingReturnStatus = async (client_return_id, sync_status, retry_count) => {
  const db = await getDB();
  const record = await db.get('pending_returns', client_return_id);
  if (!record) return;
  record.sync_status = sync_status;
  record.retry_count = retry_count;
  await db.put('pending_returns', record);
};

export const deletePendingReturn = async (client_return_id) => {
  const db = await getDB();
  await db.delete('pending_returns', client_return_id);
};

// Sums up quantities already queued for return (but not yet synced) against
// a given sale, keyed by product_id. Used by ReturnProduct.jsx so the
// returnable-quantity math accounts for a return that's sitting in the
// queue, not just what the server/cache already knows about.
export const getQueuedReturnedQtyByProduct = async ({ sale_id, client_sale_id }) => {
  const db = await getDB();
  const all = await db.getAll('pending_returns');
  const map = {};
  for (const record of all) {
    const matches =
      (sale_id && record.sale_id === sale_id) ||
      (client_sale_id && record.client_sale_id === client_sale_id);
    if (!matches) continue;
    for (const item of record.items) {
      map[item.product_id] = (map[item.product_id] || 0) + parseFloat(item.quantity);
    }
  }
  return map;
};