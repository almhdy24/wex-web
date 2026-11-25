// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  parsePushPayload,
  validateSameOriginUrl,
  hasFocusedVisibleClient,
} from '../utils/swPushHelpers';
import {
  getPushState,
  subscribeAndRegister,
  unsubscribeFromDevice,
  canShowPushPrompt,
  dismissPushPrompt,
} from '../utils/push';
import { pushApi } from '../api/push';
import { notificationsApi } from '../api/notifications';
import { PushContext } from '../context/PushContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import PushPermissionSheet from '../components/common/PushPermissionSheet';
import PushPreferencesSection from '../components/account/PushPreferencesSection';
import NotificationsPage from '../pages/store/NotificationsPage';

vi.mock('../api/push', () => ({
  pushApi: {
    getConfig: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    getSubscriptions: vi.fn(),
    deleteSubscription: vi.fn(),
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
    sendTest: vi.fn(),
  },
}));

vi.mock('../api/notifications', () => ({
  notificationsApi: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

describe('Service Worker Push Helpers', () => {
  it('parses push payload safely with RTL Arabic defaults, tag coalescing, and critical flag', () => {
    const res = parsePushPayload(
      JSON.stringify({
        title: 'تم تأكيد الدفع',
        body: 'تم تأكيد الدفع لطلبك رقم WEX-100',
        data: { type: 'payment_approved', orderNumber: 'WEX-100', url: '/orders/WEX-100' },
      })
    );
    expect(res.title).toBe('تم تأكيد الدفع');
    expect(res.options.dir).toBe('rtl');
    expect(res.options.lang).toBe('ar');
    expect(res.options.tag).toBe('order-WEX-100');
    expect(res.options.requireInteraction).toBe(true);
    expect(res.options.data.url).toBe('/orders/WEX-100');

    const fallback = parsePushPayload('invalid-json');
    expect(fallback.title).toBe('إشعار جديد من ويكس');
    expect(fallback.options.body).toBe('invalid-json');
    expect(fallback.options.requireInteraction).toBe(false);
  });

  it('validates same-origin URLs and rejects external/unsafe URLs', () => {
    expect(validateSameOriginUrl('/orders/WEX-1', 'https://wex.sd')).toBe('/orders/WEX-1');
    expect(validateSameOriginUrl('https://wex.sd/notifications?tab=1', 'https://wex.sd')).toBe('/notifications?tab=1');
    expect(validateSameOriginUrl('https://evil.com/phish', 'https://wex.sd')).toBe('/notifications');
    expect(validateSameOriginUrl('//evil.com/phish', 'https://wex.sd')).toBe('/notifications');
    expect(validateSameOriginUrl('javascript:alert(1)', 'https://wex.sd')).toBe('/notifications');
  });

  it('detects focused visible clients', () => {
    expect(hasFocusedVisibleClient([{ focused: false, visibilityState: 'hidden' }])).toBe(false);
    expect(hasFocusedVisibleClient([{ focused: true, visibilityState: 'visible' }])).toBe(true);
  });
});

describe('Push State Machine & Subscription Lifecycle', () => {
  const origUA = navigator.userAgent;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: origUA, configurable: true });
    delete window.PushManager;
    delete window.Notification;
  });

  it('detects unsupported, iOS needs-install, default, granted, and denied states', () => {
    delete window.PushManager;
    expect(getPushState()).toBe('unsupported');

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'standalone', { value: false, configurable: true });
    expect(getPushState()).toBe('needs-install-on-ios');

    Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 Chrome/120', configurable: true });
    window.PushManager = function PushManager() {};
    Object.defineProperty(navigator, 'serviceWorker', { value: { getRegistration: vi.fn() }, configurable: true });

    window.Notification = { permission: 'default' };
    expect(getPushState()).toBe('default');
    expect(canShowPushPrompt()).toBe(true);

    dismissPushPrompt(30);
    expect(canShowPushPrompt()).toBe(false);

    window.Notification = { permission: 'denied' };
    expect(getPushState()).toBe('denied');
    expect(canShowPushPrompt()).toBe(false);

    window.Notification = { permission: 'granted' };
    expect(getPushState()).toBe('granted');
  });

  it('subscribes and registers with API, then unsubscribes on logout', async () => {
    window.PushManager = function PushManager() {};
    const mockSub = {
      endpoint: 'https://push.example/device-1',
      toJSON: () => ({
        endpoint: 'https://push.example/device-1',
        keys: { p256dh: 'p256dh-val', auth: 'auth-val' },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };
    const mockReg = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(mockSub),
        subscribe: vi.fn().mockResolvedValue(mockSub),
      },
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistration: vi.fn().mockResolvedValue(mockReg) },
      configurable: true,
    });
    window.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    };
    pushApi.subscribe.mockResolvedValue({ data: { id: 1 } });
    pushApi.unsubscribe.mockResolvedValue({ data: { deleted: 1 } });

    const res = await subscribeAndRegister('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8');
    expect(res.ok).toBe(true);
    expect(pushApi.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: 'web',
        provider: 'webpush',
        subscription: {
          endpoint: 'https://push.example/device-1',
          keys: { p256dh: 'p256dh-val', auth: 'auth-val' },
        },
      })
    );

    const unsubRes = await unsubscribeFromDevice();
    expect(unsubRes).toBe(true);
    expect(pushApi.unsubscribe).toHaveBeenCalledWith('https://push.example/device-1');
    expect(mockSub.unsubscribe).toHaveBeenCalled();
  });
});

describe('Push UI Components & NotificationsPage', () => {
  it('renders pre-permission sheet states (default, iOS install, denied)', () => {
    const baseCtx = {
      isSubscribed: false,
      busy: false,
      canShowPrompt: true,
      enablePush: vi.fn(),
      dismissPrompt: vi.fn(),
    };

    const { rerender } = render(
      <PushContext.Provider value={{ ...baseCtx, pushState: 'default' }}>
        <PushPermissionSheet variant="customer" />
      </PushContext.Provider>
    );
    expect(screen.getByText('فعّل إشعارات الطلب')).toBeTruthy();

    rerender(
      <PushContext.Provider value={{ ...baseCtx, pushState: 'needs-install-on-ios' }}>
        <PushPermissionSheet variant="customer" />
      </PushContext.Provider>
    );
    expect(screen.getByText(/إضافة إلى الشاشة الرئيسية/)).toBeTruthy();

    rerender(
      <PushContext.Provider value={{ ...baseCtx, pushState: 'denied' }}>
        <PushPermissionSheet variant="customer" />
      </PushContext.Provider>
    );
    expect(screen.getByText('الإشعارات محظورة في المتصفح')).toBeTruthy();
  });

  it('renders PushPreferencesSection and triggers test send & device removal', async () => {
    const sendTestPush = vi.fn().mockResolvedValue({});
    const removeDevice = vi.fn().mockResolvedValue({});
    const updatePreferences = vi.fn().mockResolvedValue({});

    render(
      <ToastContext.Provider value={{ success: vi.fn(), error: vi.fn(), info: vi.fn() }}>
        <AuthContext.Provider value={{ user: { id: 1, role: 'customer' }, isAuthenticated: true }}>
          <PushContext.Provider
            value={{
              pushState: 'granted',
              isSubscribed: true,
              busy: false,
              preferences: {
                order_updates: true,
                payment_updates: true,
                price_alerts: true,
                announcements: false,
              },
              subscriptions: [
                { id: 7, device_label: 'Google Chrome', platform: 'web', provider: 'webpush', last_success_at: '2026-11-25T00:00:00Z' },
              ],
              enablePush: vi.fn(),
              disablePush: vi.fn(),
              updatePreferences,
              removeDevice,
              sendTestPush,
            }}
          >
            <PushPreferencesSection />
          </PushContext.Provider>
        </AuthContext.Provider>
      </ToastContext.Provider>
    );

    expect(screen.getByText('Google Chrome')).toBeTruthy();
    fireEvent.click(screen.getByText('إرسال إشعار تجريبي'));
    await waitFor(() => expect(sendTestPush).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText('إزالة Google Chrome'));
    await waitFor(() => expect(removeDevice).toHaveBeenCalledWith(7));
  });

  it('renders NotificationsPage unread count and marks notification read on click', async () => {
    notificationsApi.getNotifications.mockResolvedValue({
      data: [
        {
          id: 11,
          type: 'payment_approved',
          title: 'تم تأكيد الدفع',
          body: 'طلبك رقم WEX-55 مؤكد',
          order_number: 'WEX-55',
          is_read: false,
          created_at: '2026-11-25T04:00:00Z',
        },
      ],
    });
    notificationsApi.markRead.mockResolvedValue({ data: { is_read: true } });
    const refreshUnreadCount = vi.fn();

    render(
      <MemoryRouter>
        <ToastContext.Provider value={{ success: vi.fn(), error: vi.fn(), info: vi.fn() }}>
          <AuthContext.Provider value={{ user: { id: 1, role: 'customer' }, isAuthenticated: true }}>
            <PushContext.Provider value={{ refreshUnreadCount }}>
              <NotificationsPage />
            </PushContext.Provider>
          </AuthContext.Provider>
        </ToastContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('تم تأكيد الدفع')).toBeTruthy());
    expect(screen.getByText('غير مقروء (1)')).toBeTruthy();

    fireEvent.click(screen.getByText('تم تأكيد الدفع'));
    await waitFor(() => expect(notificationsApi.markRead).toHaveBeenCalledWith(11));
    expect(refreshUnreadCount).toHaveBeenCalled();
  });
});
