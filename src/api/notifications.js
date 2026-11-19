import { api } from './client';

export const notificationsApi = {
  /**
   * List customer notifications
   */
  getNotifications(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return api.get(`/notifications${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount() {
    return api.get('/notifications/unread-count');
  },

  /**
   * Mark single notification as read
   */
  markRead(id) {
    return api.patch(`/notifications/${id}/read`, {});
  },

  /**
   * Mark all notifications as read
   */
  markAllRead() {
    return api.post('/notifications/mark-all-read', {});
  },
};
