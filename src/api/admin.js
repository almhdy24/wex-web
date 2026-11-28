import { api, apiClient } from './client';

export const adminApi = {
  // Operational Dashboard
  getDashboard() {
    return api.get('/admin/dashboard');
  },

  // Orders Management
  getOrders(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return api.get(`/admin/orders${qs ? `?${qs}` : ''}`);
  },

  getOrderDetail(orderNumber) {
    return api.get(`/admin/orders/${encodeURIComponent(orderNumber)}`);
  },

  updateOrderStatus(orderNumber, { status, note, courier_name, courier_phone }) {
    const payload = { status };
    if (note) payload.note = note;
    if (courier_name) payload.courier_name = courier_name;
    if (courier_phone) payload.courier_phone = courier_phone;
    return api.patch(`/admin/orders/${encodeURIComponent(orderNumber)}/status`, payload);
  },

  extendLock(orderNumber, hours = 4) {
    return api.post(`/admin/orders/${encodeURIComponent(orderNumber)}/lock`, { hours: Number(hours) });
  },

  resetOrphanOrder(orderNumber) {
    return api.post(`/admin/orders/${encodeURIComponent(orderNumber)}/reset-orphan`);
  },

  reviewPaymentProof(orderNumber, proofId, { action, note }) {
    return api.post(`/admin/orders/${encodeURIComponent(orderNumber)}/proofs/${proofId}/review`, {
      action,
      note: note || undefined,
    });
  },

  getPaymentProofImage(orderNumber, proofId) {
    return apiClient(`/orders/${encodeURIComponent(orderNumber)}/payment-proof/${proofId}/image`);
  },

  // Product Catalog CRUD
  getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return api.get(`/admin/products${qs ? `?${qs}` : ''}`);
  },

  // Promotions / ads
  getPromotions() {
    return api.get('/admin/promotions');
  },
  getPromotion(id) {
    return api.get(`/admin/promotions/${id}`);
  },
  createPromotion(payload) {
    return api.post('/admin/promotions', payload);
  },
  updatePromotion(id, payload) {
    return api.patch(`/admin/promotions/${id}`, payload);
  },
  deletePromotion(id) {
    return api.delete(`/admin/promotions/${id}`);
  },
  togglePromotion(id) {
    return api.patch(`/admin/promotions/${id}/toggle`, {});
  },
  duplicatePromotion(id) {
    return api.post(`/admin/promotions/${id}/duplicate`, {});
  },
  uploadPromotionImage(id, formData) {
    return api.post(`/admin/promotions/${id}/image`, formData);
  },

  /** Spec schema per product type (single source of truth, shared with the server validation). */
  getSpecSchema() {
    return api.get('/spec-schema');
  },

  restoreProduct(id) {
    return api.post(`/admin/products/${id}/restore`, {});
  },

  getProductCounts() {
    return api.get('/admin/products/counts');
  },

  createProduct(payload) {
    return api.post('/admin/products', payload);
  },

  getProduct(id) {
    return api.get(`/admin/products/${id}`);
  },

  updateProduct(id, payload) {
    return api.patch(`/admin/products/${id}`, payload);
  },

  deleteProduct(id) {
    return api.delete(`/admin/products/${id}`);
  },

  updateStock(id, stockQuantity) {
    return api.patch(`/admin/products/${id}/stock`, { stock_quantity: Number(stockQuantity) });
  },

  linkAccessory(id, accessoryId) {
    return api.post(`/admin/products/${id}/accessories`, { accessory_id: Number(accessoryId) });
  },

  unlinkAccessory(id, accessoryId) {
    return api.delete(`/admin/products/${id}/accessories/${accessoryId}`);
  },

  uploadProductImages(id, formData) {
    return api.post(`/admin/products/${id}/images`, formData);
  },

  updateProductImage(id, imageId, payload) {
    return api.patch(`/admin/products/${id}/images/${imageId}`, payload);
  },

  reorderProductImages(id, order) {
    return api.put(`/admin/products/${id}/images/order`, { order });
  },

  deleteProductImage(id, imageId) {
    return api.delete(`/admin/products/${id}/images/${imageId}`);
  },

  // Categories CRUD
  getCategories() {
    return api.get('/admin/categories');
  },

  createCategory(payload) {
    return api.post('/admin/categories', payload);
  },

  getCategory(id) {
    return api.get(`/admin/categories/${id}`);
  },

  updateCategory(id, payload) {
    return api.patch(`/admin/categories/${id}`, payload);
  },

  deleteCategory(id) {
    return api.delete(`/admin/categories/${id}`);
  },

  // Brands CRUD
  getBrands() {
    return api.get('/admin/brands');
  },

  createBrand(payload) {
    return api.post('/admin/brands', payload);
  },

  getBrand(id) {
    return api.get(`/admin/brands/${id}`);
  },

  updateBrand(id, payload) {
    return api.patch(`/admin/brands/${id}`, payload);
  },

  deleteBrand(id) {
    return api.delete(`/admin/brands/${id}`);
  },

  // Settings & Exchange Rates
  getRates(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/admin/rates${query ? `?${query}` : ''}`);
  },

  updateRate(rateSdg) {
    return api.post('/admin/rates', { rate_sdg: Number(rateSdg) });
  },

  getSettings() {
    return api.get('/admin/settings');
  },

  // What the shop still needs before ordering can be opened (fresh installs start closed).
  getSetupStatus() {
    return api.get('/admin/setup-status');
  },

  updateSettings(payload) {
    return api.patch('/admin/settings', payload);
  },

  // Shipping Zones CRUD
  getShippingZones() {
    return api.get('/admin/shipping-zones');
  },

  createShippingZone(payload) {
    return api.post('/admin/shipping-zones', payload);
  },

  updateShippingZone(id, payload) {
    return api.patch(`/admin/shipping-zones/${id}`, payload);
  },

  deleteShippingZone(id) {
    return api.delete(`/admin/shipping-zones/${id}`);
  },

  // Users Management
  getUsers(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return api.get(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  getUser(id) {
    return api.get(`/admin/users/${id}`);
  },

  updateUserRole(id, role) {
    return api.patch(`/admin/users/${id}/role`, { role });
  },

  updateUserStatus(id, isActive) {
    return api.patch(`/admin/users/${id}/status`, { is_active: Boolean(isActive) });
  },

  // Audit Logs
  getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return api.get(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

export default adminApi;
