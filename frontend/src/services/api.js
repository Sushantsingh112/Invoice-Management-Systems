import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ── Clients ───────────────────────────────────────────────────
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getAllSimple: () => api.get('/clients/all'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// ── Quotations ────────────────────────────────────────────────
export const quotationsAPI = {
  getAll: (params) => api.get('/quotations', { params }),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
  duplicate: (id) => api.post(`/quotations/${id}/duplicate`),
  send: (id) => api.post(`/quotations/${id}/send`),
  convertToInvoice: (id) => api.post(`/quotations/${id}/convert-to-invoice`),
  updateStatus: (id, status) => api.patch(`/quotations/${id}/status`, { status }),
  getPdf: (id) => api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
};

// ── Invoices ──────────────────────────────────────────────────
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  duplicate: (id) => api.post(`/invoices/${id}/duplicate`),
  send: (id) => api.post(`/invoices/${id}/send`),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payments`, data),
  getPdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// ── Payments ──────────────────────────────────────────────────
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getRevenue: () => api.get('/dashboard/revenue'),
  getInvoiceStatus: () => api.get('/dashboard/invoice-status'),
  getQuotationStatus: () => api.get('/dashboard/quotation-status'),
  getPaymentSummary: () => api.get('/dashboard/payment-summary'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// ── Settings ──────────────────────────────────────────────────
export const settingsAPI = {
  getGeneral: () => api.get('/settings/general'),
  updateGeneral: (data) => api.put('/settings/general', data),
  getBusiness: () => api.get('/settings/business'),
  updateBusiness: (data) => api.put('/settings/business', data),
  uploadLogo: (file) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post('/settings/business/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getQuotation: () => api.get('/settings/quotation'),
  updateQuotation: (data) => api.put('/settings/quotation', data),
  getInvoice: () => api.get('/settings/invoice'),
  updateInvoice: (data) => api.put('/settings/invoice', data),
  getPayment: () => api.get('/settings/payment'),
  updatePayment: (data) => api.put('/settings/payment', data),
  getTax: () => api.get('/settings/tax'),
  createTax: (data) => api.post('/settings/tax', data),
  updateTax: (id, data) => api.put(`/settings/tax/${id}`, data),
  deleteTax: (id) => api.delete(`/settings/tax/${id}`),
  getEmail: () => api.get('/settings/email'),
  updateEmail: (data) => api.put('/settings/email', data),
  testEmail: (email) => api.post('/settings/email/test', { email }),
  getTranslation: () => api.get('/settings/translation'),
  updateTranslation: (data) => api.put('/settings/translation', data),
  getPdfTemplates: () => api.get('/settings/pdf-templates'),
  getPredefinedItems: () => api.get('/settings/predefined-items'),
  createPredefinedItem: (data) => api.post('/settings/predefined-items', data),
  deletePredefinedItem: (id) => api.delete(`/settings/predefined-items/${id}`),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsAPI = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getPayments: (params) => api.get('/reports/payments', { params }),
  getOutstanding: () => api.get('/reports/outstanding'),
  getQuotations: (params) => api.get('/reports/quotations', { params }),
  getTax: (params) => api.get('/reports/tax', { params }),
  exportInvoices: (params) => api.get('/reports/export/invoices', { params, responseType: 'blob' }),
};
