const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const productAPI = {
  getAll: async () => {
    // The backend scopes results by req.user.store_id from the JWT,
    // so no query param is needed — but we keep this clean for clarity.
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      // Successful fetch -> refresh the offline cache in the background.
      // Imported lazily here (not at top-level) to avoid a circular import
      // between api.js and offlineDB.js.
      import('./offlineDB').then(({ replaceProductsCache }) => {
        replaceProductsCache(data);
      });

      return data;
    } catch (err) {
      // Network failed (or server unreachable) — fall back to whatever
      // was cached from the last successful load instead of leaving the
      // POS screen empty.
      const { getCachedProducts } = await import('./offlineDB');
      const cached = await getCachedProducts();
      if (cached.length > 0) return cached;
      throw err; // truly nothing cached and nothing reachable — let caller handle it
    }
  }
};

export const salesAPI = {
  create: async (saleData) => {
    const response = await fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(saleData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create sale');
    }
    return response.json();
  },

  getMySales: async () => {
    const response = await fetch(`${API_BASE_URL}/sales/my`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch sales');
    return response.json();
  },

  getByReceipt: async (receiptNo) => {
    const response = await fetch(`${API_BASE_URL}/sales/receipt/${receiptNo}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Sale not found');
    return response.json();
  },

  processReturn: async (returnData) => {
    const response = await fetch(`${API_BASE_URL}/sales/return`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(returnData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process return');
    }
    return response.json();
  }
};