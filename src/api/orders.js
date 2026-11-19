import { api, apiClient } from './client';

export const ordersApi = {
  /**
   * List authenticated customer's orders
   */
  getOrders(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return api.get(`/orders${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get single order detail by order number
   */
  getOrderDetail(orderNumber) {
    return api.get(`/orders/${encodeURIComponent(orderNumber)}`);
  },

  /**
   * Create new order
   */
  createOrder(payload) {
    return api.post('/orders', payload);
  },

  /**
   * Cancel pending order
   */
  cancelOrder(orderNumber) {
    return api.post(`/orders/${encodeURIComponent(orderNumber)}/cancel`, {});
  },

  /**
   * Reorder cancelled or expired order
   */
  reorder(orderNumber) {
    return api.post(`/orders/${encodeURIComponent(orderNumber)}/reorder`, {});
  },

  /**
   * Upload bank transfer receipt image (multipart FormData)
   */
  uploadPaymentProof(orderNumber, formData) {
    return api.post(`/orders/${encodeURIComponent(orderNumber)}/payment-proof`, formData);
  },

  /**
   * Stream authorized payment proof image blob
   */
  getPaymentProofImage(orderNumber, proofId) {
    return apiClient(`/orders/${encodeURIComponent(orderNumber)}/payment-proof/${proofId}/image`);
  },
};
