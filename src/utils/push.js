import { pushApi } from '../api/push';

const DISMISS_KEY = 'wex_push_prompt_dismissed_until';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.navigator?.standalone === true ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
  );
}

/**
 * Detect push notification support and permission state machine:
 * 'unsupported' | 'needs-install-on-ios' | 'default' | 'granted' | 'denied'
 */
export function getPushState() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unsupported';
  }

  if (isIosDevice() && !isStandalonePwa()) {
    return 'needs-install-on-ios';
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }

  const perm = Notification.permission;
  if (perm === 'granted' || perm === 'denied' || perm === 'default') {
    return perm;
  }

  return 'default';
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getDeviceLabel() {
  if (typeof navigator === 'undefined') return 'متصفح ويب';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'متصفح Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone / iPad PWA';
  if (/Edg/i.test(ua)) return 'Microsoft Edge';
  if (/Chrome/i.test(ua)) return 'Google Chrome';
  if (/Firefox/i.test(ua)) return 'Mozilla Firefox';
  if (/Safari/i.test(ua)) return 'Safari';
  return 'متصفح ويب';
}

export async function getActiveSwRegistration() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.ready;
}

export function buildSubscriptionPayload(subscription) {
  const json = typeof subscription.toJSON === 'function' ? subscription.toJSON() : subscription;
  return {
    platform: isIosDevice() ? 'ios' : 'web',
    provider: 'webpush',
    subscription: {
      endpoint: json.endpoint,
      keys: json.keys || {},
    },
    device_label: getDeviceLabel(),
    locale: 'ar',
  };
}

export async function subscribeAndRegister(publicKey) {
  const state = getPushState();
  if (state === 'unsupported' || state === 'needs-install-on-ios') {
    return { ok: false, state };
  }

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();

  if (permission !== 'granted') {
    if (permission === 'denied') {
      dismissPushPrompt(30);
    }
    return { ok: false, state: permission };
  }

  const reg = await getActiveSwRegistration();
  if (!reg || !reg.pushManager) {
    return { ok: false, state: 'unsupported' };
  }

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const payload = buildSubscriptionPayload(sub);
  await pushApi.subscribe(payload);

  return { ok: true, state: 'granted', subscription: sub };
}

export async function syncExistingSubscription(publicKey) {
  if (getPushState() !== 'granted' || !publicKey) return null;
  try {
    const reg = await getActiveSwRegistration();
    if (!reg?.pushManager) return null;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    await pushApi.subscribe(buildSubscriptionPayload(sub));
    return sub;
  } catch {
    return null;
  }
}

export async function unsubscribeFromDevice() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg?.pushManager) return false;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;

    try {
      await pushApi.unsubscribe(sub.endpoint);
    } catch {
      // ignore API errors during logout
    }
    await sub.unsubscribe();
    return true;
  } catch {
    return false;
  }
}

export function canShowPushPrompt() {
  const state = getPushState();
  if (state === 'granted' || state === 'unsupported') return false;
  if (state === 'denied') return false;

  try {
    const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (until > Date.now()) return false;
  } catch {
    // ignore storage errors
  }

  return true;
}

export function dismissPushPrompt(days = 30) {
  try {
    const ms = days * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(Date.now() + (ms || THIRTY_DAYS_MS)));
  } catch {
    // ignore storage errors
  }
}
