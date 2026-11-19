import { api } from './client';

export const authApi = {
  /**
   * Request 6-digit OTP code to email
   */
  requestEmailOtp(email) {
    return api.post('/auth/email/request', { email });
  },

  /**
   * Verify 6-digit OTP code and authenticate
   */
  verifyEmailOtp({ email, code, name }) {
    const payload = { email, code };
    if (name) {
      payload.name = name;
    }
    return api.post('/auth/email/verify', payload);
  },

  /**
   * Sign in using verified Google ID token
   */
  googleSignIn(idToken) {
    return api.post('/auth/google', { id_token: idToken });
  },

  /**
   * Refresh access token using active refresh token
   */
  refresh(refreshToken) {
    return api.post('/auth/refresh', { refresh_token: refreshToken });
  },

  /**
   * Logout current session
   */
  logout(refreshToken) {
    return api.post('/auth/logout', { refresh_token: refreshToken });
  },

  /**
   * Logout from all devices/sessions
   */
  logoutAll() {
    return api.post('/auth/logout-all', {});
  },

  /**
   * Current user profile
   */
  getMe() {
    return api.get('/me');
  },

  /**
   * Update name and Sudanese phone
   */
  updateMe({ name, phone }) {
    const payload = {};
    if (name !== undefined) payload.name = name;
    if (phone !== undefined) payload.phone = phone;
    return api.patch('/me', payload);
  },

  /**
   * Update email notification preferences
   */
  updatePreferences(emailNotifications) {
    return api.patch('/me/preferences', {
      email_notifications: Boolean(emailNotifications),
    });
  },

  /**
   * Soft-delete customer account
   */
  deleteMe() {
    return api.delete('/me');
  },
};
