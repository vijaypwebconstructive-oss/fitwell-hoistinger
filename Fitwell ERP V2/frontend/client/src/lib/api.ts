import { apiRequest, getQueryFn } from "./queryClient";

const safeArray = (data: any) => (Array.isArray(data) ? data : []);

// Helper to get API base URL (same as in queryClient)
const getApiBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/$/, "");
  }
  return "";
};

console.log("API URL:", import.meta.env.VITE_API_URL);

// Helper function for GET requests that need to use the base URL
const apiGet = (url: string) => {
  const apiBase = getApiBaseUrl();
  const fullUrl = url.startsWith("http") ? url : `${apiBase}${url}`;
  return fetch(fullUrl, { credentials: "include" }).then((res) => res.json());
};

export const api = {
  // Products
  getProducts: () => apiGet("/api/products"),
  createProduct: (data: any) => apiRequest("POST", "/api/products", data),
  updateProduct: (id: number, data: any) =>
    apiRequest("PUT", `/api/products/${id}`, data),
  deleteProduct: (id: number) => apiRequest("DELETE", `/api/products/${id}`),

  // Parties
  getParties: () => apiGet("/api/parties"),
  createParty: (data: any) => apiRequest("POST", "/api/parties", data),
  updateParty: (id: number, data: any) =>
    apiRequest("PUT", `/api/parties/${id}`, data),
  deleteParty: (id: number) => apiRequest("DELETE", `/api/parties/${id}`),

  // Production
  getProduction: () => apiGet("/api/production"),
  createProduction: (data: any) => apiRequest("POST", "/api/production", data),
  updateProduction: (id: number, data: any) =>
    apiRequest("PUT", `/api/production/${id}`, data),
  deleteProduction: (id: number) =>
    apiRequest("DELETE", `/api/production/${id}`),

  // Sales
  getSalesOrders: () => apiGet("/api/sales"),
  getSalesOrder: (id: number) => apiGet(`/api/sales/${id}`),
  createSalesOrder: (data: any) => apiRequest("POST", "/api/sales", data),
  fulfillOrder: (id: number, data: any) =>
    apiRequest("POST", `/api/sales/${id}/fulfill`, data),
  deleteSalesOrder: (id: number) => apiRequest("DELETE", `/api/sales/${id}`),
  cancelInvoice: (id: number) => apiRequest("PUT", `/api/sales/${id}/cancel`),

  // Stock Adjustments
  getStockAdjustments: () => apiGet("/api/stock-adjustments"),
  createStockAdjustment: (data: any) =>
    apiRequest("POST", "/api/stock-adjustments", data),

  // Inventory
  getInventory: () => apiGet("/api/inventory"),

  // Dashboard
  getDashboardMetrics: () => apiGet("/api/dashboard/metrics"),
};
