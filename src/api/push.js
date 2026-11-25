import { api } from './client';

export const pushApi = {
  getConfig() {
    return api.get('/push/config');
  },

  getSubscriptions() {
    return api.get('/push/subscriptions');
  },

  subscribe(payload) {
    return api.post('/push/subscriptions', payload);
  },

  unsubscribe(endpointOrToken) {
    return api.delete('/push/subscriptions', {
      body: JSON.stringify({ endpoint_or_token: endpointOrToken }),
    });
  },

  deleteSubscription(id) {
    return api.delete(`/push/subscriptions/${id}`);
  },

  getPreferences() {
    return api.get('/push/preferences');
  },

  updatePreferences(prefs) {
    return api.put('/push/preferences', prefs);
  },

  sendTest() {
    return api.post('/push/test', {});
  },

  // Admin endpoints
  adminGetStats() {
    return api.get('/admin/push/stats');
  },

  adminGetLog(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/push/log${q ? `?${q}` : ''}`);
  },

  adminBroadcast(payload) {
    return api.post('/admin/push/broadcast', payload);
  },

  adminUpdateSettings(payload) {
    return api.put('/admin/push/settings', payload);
  },
};
