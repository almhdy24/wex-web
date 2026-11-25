import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { pushApi } from '../api/push';
import { notificationsApi } from '../api/notifications';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastContext';
import {
  buildSubscriptionPayload,
  canShowPushPrompt,
  dismissPushPrompt,
  getPushState,
  subscribeAndRegister,
  syncExistingSubscription,
  unsubscribeFromDevice,
} from '../utils/push';

export const PushContext = createContext(null);

export function PushProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { info } = useToast();

  const [pushState, setPushState] = useState(() => getPushState());
  const [config, setConfig] = useState({ webPushPublicKey: '', enabled: false });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return 0;
    }
    try {
      const res = await notificationsApi.getUnreadCount();
      const count = Number(res?.data?.unread_count || 0);
      setUnreadCount(count);
      if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SET_APP_BADGE', count });
      }
      return count;
    } catch {
      return unreadCount;
    }
  }, [isAuthenticated, unreadCount]);

  const refreshSubscriptions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await pushApi.getSubscriptions();
      setSubscriptions(Array.isArray(res?.data) ? res.data : []);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  const refreshPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await pushApi.getPreferences();
      if (res?.data) setPreferences(res.data);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // Sync config & existing subscription on auth change
  useEffect(() => {
    let active = true;
    setPushState(getPushState());

    if (!isAuthenticated || !user?.id) {
      setIsSubscribed(false);
      setPreferences(null);
      setSubscriptions([]);
      setUnreadCount(0);
      return;
    }

    (async () => {
      try {
        const cfgRes = await pushApi.getConfig();
        const cfg = cfgRes?.data || { webPushPublicKey: '', enabled: false };
        if (active) setConfig(cfg);

        if (cfg.enabled && cfg.webPushPublicKey && getPushState() === 'granted') {
          const sub = await syncExistingSubscription(cfg.webPushPublicKey);
          if (active) setIsSubscribed(Boolean(sub));
        }
      } catch {
        // ignore
      }
      if (active) {
        refreshUnreadCount();
        refreshPreferences();
        refreshSubscriptions();
      }
    })();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id, refreshUnreadCount, refreshPreferences, refreshSubscriptions]);

  // Listen for Service Worker push messages (foreground toast, click mark-read, resubscribe)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const onMessage = async (event) => {
      const msg = event?.data;
      if (!msg || !msg.type) return;

      if (msg.type === 'WEX_PUSH_FOREGROUND' && msg.payload) {
        const title = msg.payload.title || 'إشعار جديد';
        const body = msg.payload.body || '';
        info(body ? `${title}: ${body}` : title);
        refreshUnreadCount();
      } else if (msg.type === 'WEX_PUSH_CLICKED') {
        if (msg.notificationId && navigator.onLine) {
          try {
            await notificationsApi.markRead(msg.notificationId);
          } catch {
            // ignore
          }
        }
        refreshUnreadCount();
      } else if (msg.type === 'WEX_PUSH_SUBSCRIPTION_CHANGE' && msg.subscription && isAuthenticated) {
        try {
          await pushApi.subscribe(buildSubscriptionPayload(msg.subscription));
          refreshSubscriptions();
        } catch {
          // ignore
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [info, isAuthenticated, refreshUnreadCount, refreshSubscriptions]);

  const enablePush = useCallback(async () => {
    setBusy(true);
    try {
      let publicKey = config.webPushPublicKey;
      if (!publicKey) {
        const cfgRes = await pushApi.getConfig();
        const cfg = cfgRes?.data || {};
        setConfig(cfg);
        publicKey = cfg.webPushPublicKey;
      }
      if (!publicKey) {
        return { ok: false, state: 'disabled' };
      }
      const res = await subscribeAndRegister(publicKey);
      setPushState(getPushState());
      if (res.ok) {
        setIsSubscribed(true);
        await refreshSubscriptions();
      }
      return res;
    } finally {
      setBusy(false);
    }
  }, [config.webPushPublicKey, refreshSubscriptions]);

  const disablePush = useCallback(async () => {
    setBusy(true);
    try {
      await unsubscribeFromDevice();
      setIsSubscribed(false);
      await refreshSubscriptions();
    } finally {
      setBusy(false);
    }
  }, [refreshSubscriptions]);

  const updatePreferences = useCallback(async (nextPrefs) => {
    const res = await pushApi.updatePreferences(nextPrefs);
    if (res?.data) {
      setPreferences(res.data);
    }
    return res?.data;
  }, []);

  const removeDevice = useCallback(async (id) => {
    await pushApi.deleteSubscription(id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const sendTestPush = useCallback(async () => {
    return pushApi.sendTest();
  }, []);

  const dismissPrompt = useCallback((days = 30) => {
    dismissPushPrompt(days);
  }, []);

  return (
    <PushContext.Provider
      value={{
        pushState,
        config,
        isSubscribed,
        preferences,
        subscriptions,
        unreadCount,
        busy,
        canShowPrompt: canShowPushPrompt(),
        enablePush,
        disablePush,
        updatePreferences,
        removeDevice,
        sendTestPush,
        dismissPrompt,
        refreshUnreadCount,
        refreshSubscriptions,
        refreshPreferences,
      }}
    >
      {children}
    </PushContext.Provider>
  );
}

export function usePush() {
  return useContext(PushContext);
}
