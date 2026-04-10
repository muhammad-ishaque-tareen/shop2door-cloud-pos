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
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
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