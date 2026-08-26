// Orchestrates everything offline-related:
//   - real connectivity detection (navigator.onLine is necessary but not
//     sufficient — a dead wifi-with-no-internet still reports online)
//   - queueing a sale when offline or when an online attempt fails mid-flight
//   - replaying the queue in order once connectivity is confirmed
//   - a tiny pub/sub so React components can show "Offline" / "Syncing"
//     badges without polling

import { salesAPI } from './api';
import { API_BASE_URL } from '../config';
import {
  savePendingSale,
  getAllPendingSales,
  getPendingSalesCount,
  updatePendingSaleStatus,
  deletePendingSale,
  decrementCachedStock,
} from './offlineDB';

const HEALTH_CHECK_URL = `${API_BASE_URL}/api/health`;
const HEALTH_CHECK_INTERVAL_MS = 20000; // 20s heartbeat
const HEALTH_CHECK_TIMEOUT_MS = 4000;   // don't let a hung request block forever
const MAX_RETRY_COUNT = 5;

// ---- tiny event bus so UI components can subscribe without prop drilling ---
const listeners = new Set();
const emit = (state) => listeners.forEach((fn) => fn(state));
export const subscribeToSyncStatus = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

let currentState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingCount: 0,
};

const setState = (patch) => {
  currentState = { ...currentState, ...patch };
  emit(currentState);
};

export const getSyncState = () => currentState;

/*  CONNECTIVITY DETECTION */
// Two layers, because navigator.onLine only reflects the network adapter,
// not whether the API server is actually reachable.

const pingServer = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(HEALTH_CHECK_URL, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

let heartbeatTimer = null;

const startHeartbeat = () => {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(async () => {
    const reachable = await pingServer();
    if (reachable && !currentState.isOnline) {
      // We were marked offline but the server just answered — recovered.
      setState({ isOnline: true });
      syncPendingSales();
    } else if (!reachable && currentState.isOnline) {
      // navigator.onLine still says true, but the server isn't answering.
      setState({ isOnline: false });
    }
  }, HEALTH_CHECK_INTERVAL_MS);
};

export const initOfflineSync = async () => {
  // Initial pending count, in case the app was closed mid-queue.
  const count = await getPendingSalesCount();
  setState({ pendingCount: count, isOnline: navigator.onLine });

  window.addEventListener('online', async () => {
    // navigator says online — confirm with a real ping before trusting it.
    const reachable = await pingServer();
    setState({ isOnline: reachable });
    if (reachable) syncPendingSales();
  });

  window.addEventListener('offline', () => {
    setState({ isOnline: false });
  });

  startHeartbeat();

  // If we're already online at boot and there's a leftover queue
  // (e.g. app was closed before syncing finished), sync immediately.
  if (navigator.onLine && count > 0) {
    syncPendingSales();
  }
};

/*  QUEUEING A SALE    */

// Called from POSTerminal.jsx instead of calling salesAPI.create() directly.
// Handles three windows of failure:
//   A. We already know we're offline -> queue immediately, never attempt fetch.
//   B. We think we're online but the request throws (drop mid-flight,
//      DNS fail, timeout) -> queue it; we do NOT know if the server actually
//      committed it before the response was lost, hence client_sale_id +
//      server-side idempotency check (see sales.controller.js).
//   C. Request succeeds -> done, nothing queued.

export const queueOrSendSale = async (saleData) => {
  const client_sale_id = crypto.randomUUID();
  const payload = { ...saleData, client_sale_id };
  const shortId = client_sale_id.slice(0, 8).toUpperCase();

  const enqueue = async () => {
    await savePendingSale({
      client_sale_id,
      saleData: payload,
      created_at: Date.now(),
      sync_status: 'pending',
      retry_count: 0,
    });
    // Optimistically reflect the sale in the cached stock so the very next
    // offline sale (same shift, same cashier) doesn't oversell.
    await decrementCachedStock(saleData.items);
    setState({ pendingCount: await getPendingSalesCount() });
    return {
      success: true,
      queued: true,
      receipt_no: `OFFLINE-${shortId}`,
      client_sale_id,
    };
  };

  if (!currentState.isOnline) {
    return enqueue();
  }

  try {
    const result = await salesAPI.create(payload);
    return { ...result, queued: false };
  } catch (err) {
    // Could be a real network drop (window B above) or a genuine business
    // error (e.g. "Insufficient stock") returned by the server. We can't
    // safely tell those apart from a thrown fetch error alone, but
    // queuing a true validation failure just means it will fail again
    // (and stop) on sync — see syncPendingSales below. Safer to queue than
    // to silently lose a sale the cashier believes went through.
    setState({ isOnline: false });
    return enqueue();
  }
};

/*  SYNC-BACK */

let syncInFlight = false;

export const syncPendingSales = async () => {
  if (syncInFlight) return; // never run two syncs concurrently
  syncInFlight = true;
  setState({ isSyncing: true });

  try {
    const pending = await getAllPendingSales();

    for (const record of pending) {
      try {
        // Same client_sale_id every retry -> server-side idempotency check
        // returns the original sale instead of double-inserting if this
        // exact request already succeeded once before a dropped response.
        await salesAPI.create(record.saleData);
        await deletePendingSale(record.client_sale_id);
        setState({ pendingCount: await getPendingSalesCount() });
      } catch (err) {
        const nextRetryCount = record.retry_count + 1;

        if (nextRetryCount >= MAX_RETRY_COUNT) {
          // Likely a genuine, permanent business error (e.g. stock sold out
          // in the meantime by another terminal) rather than a transient
          // network blip. Mark as failed instead of retrying forever, and
          // surface it for manual review rather than silently dropping it.
          await updatePendingSaleStatus(record.client_sale_id, 'failed', nextRetryCount);
        } else {
          await updatePendingSaleStatus(record.client_sale_id, 'pending', nextRetryCount);
        }

        // Stop on first failure so sales stay in order — don't let sale #5
        // sync before sale #3 has had its chance.
        setState({ isOnline: false });
        break;
      }
    }
  } finally {
    syncInFlight = false;
    setState({ isSyncing: false });
  }
};

export const getFailedSales = async () => {
  const pending = await getAllPendingSales();
  return pending.filter((s) => s.sync_status === 'failed');
};

// Manual retry for a sale stuck in 'failed' state — e.g. cashier/admin
// reviewed it and wants to try again (stock may have been restocked since).
export const retryFailedSale = async (client_sale_id) => {
  await updatePendingSaleStatus(client_sale_id, 'pending', 0);
  syncPendingSales();
};