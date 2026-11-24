import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToastContainer } from '../components/common/Toast';

export const ToastContext = createContext(null);

const DEDUPE_WINDOW_MS = 2000;
const MAX_VISIBLE = 1;
const DEFAULT_DURATION_MS = 4000;
const ACTION_DURATION_MS = 6000;
const ERROR_DURATION_MS = 8000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const recentDispatchesRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((payload, typeArg = 'info', durationArg, actionArg) => {
    let opts = {};
    if (typeof payload === 'object' && payload !== null && !React.isValidElement(payload)) {
      opts = { ...payload };
    } else {
      opts = {
        title: payload,
        type: typeArg,
        duration: durationArg,
        action: actionArg,
      };
    }

    const type = opts.type || 'info';
    const title = opts.title || opts.message || '';
    const detail = opts.detail || null;
    const action = opts.action || null;
    const duration = opts.duration !== undefined
      ? opts.duration
      : type === 'error'
      ? ERROR_DURATION_MS
      : action
      ? ACTION_DURATION_MS
      : DEFAULT_DURATION_MS;

    const dedupeKey = opts.dedupeKey || [
      type,
      typeof title === 'string' ? title : '',
      typeof detail === 'string' ? detail : '',
    ].join('::');

    const now = Date.now();
    const lastDispatched = recentDispatchesRef.current.get(dedupeKey);

    // If within dedupe window of 2 seconds
    if (lastDispatched && now - lastDispatched.timestamp < DEDUPE_WINDOW_MS) {
      recentDispatchesRef.current.set(dedupeKey, { id: lastDispatched.id, timestamp: now });
      // Update existing toast in place instead of creating another
      setToasts((prev) => {
        const index = prev.findIndex((t) => t.id === lastDispatched.id || t.dedupeKey === dedupeKey);
        if (index !== -1) {
          const updated = [...prev];
          const existing = updated[index];
          updated[index] = {
            ...existing,
            count: (existing.count || 1) + 1,
            title: title || existing.title,
            detail: detail || existing.detail,
            action: action || existing.action,
            duration,
          };
          return updated;
        }
        return prev;
      });
      return lastDispatched.id;
    }

    const id = opts.id || `${now}_${Math.random().toString(36).substring(2, 7)}`;
    recentDispatchesRef.current.set(dedupeKey, { id, timestamp: now });

    const newToast = {
      id,
      dedupeKey,
      type,
      title,
      detail,
      action,
      duration,
      count: 1,
    };

    setToasts((prev) => {
      // Max 1 visible: keep newest
      const queue = MAX_VISIBLE > 1 ? prev.slice(-(MAX_VISIBLE - 1)) : [];
      return [...queue, newToast];
    });

    return id;
  }, []);

  const showToast = useCallback((msg, type = 'info', duration, action) => {
    return addToast(msg, type, duration, action);
  }, [addToast]);

  const success = useCallback((opts, detailOrDuration, action) => {
    if (typeof opts === 'object' && opts !== null && !React.isValidElement(opts)) {
      return addToast({ ...opts, type: 'success' });
    }
    const duration = typeof detailOrDuration === 'number' ? detailOrDuration : undefined;
    const detail = typeof detailOrDuration !== 'number' ? detailOrDuration : undefined;
    return addToast({ title: opts, detail, type: 'success', duration, action });
  }, [addToast]);

  const error = useCallback((opts, detailOrDuration, action) => {
    if (typeof opts === 'object' && opts !== null && !React.isValidElement(opts)) {
      return addToast({ ...opts, type: 'error' });
    }
    const duration = typeof detailOrDuration === 'number' ? detailOrDuration : undefined;
    const detail = typeof detailOrDuration !== 'number' ? detailOrDuration : undefined;
    return addToast({ title: opts, detail, type: 'error', duration, action });
  }, [addToast]);

  const warning = useCallback((opts, detailOrDuration, action) => {
    if (typeof opts === 'object' && opts !== null && !React.isValidElement(opts)) {
      return addToast({ ...opts, type: 'warning' });
    }
    const duration = typeof detailOrDuration === 'number' ? detailOrDuration : undefined;
    const detail = typeof detailOrDuration !== 'number' ? detailOrDuration : undefined;
    return addToast({ title: opts, detail, type: 'warning', duration, action });
  }, [addToast]);

  const info = useCallback((opts, detailOrDuration, action) => {
    if (typeof opts === 'object' && opts !== null && !React.isValidElement(opts)) {
      return addToast({ ...opts, type: 'info' });
    }
    const duration = typeof detailOrDuration === 'number' ? detailOrDuration : undefined;
    const detail = typeof detailOrDuration !== 'number' ? detailOrDuration : undefined;
    return addToast({ title: opts, detail, type: 'info', duration, action });
  }, [addToast]);

  const actionToast = useCallback((msg, action, duration = ACTION_DURATION_MS) => {
    return addToast(msg, 'info', duration, action);
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        showToast,
        success,
        error,
        warning,
        info,
        actionToast,
        clearAll,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
      showToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      actionToast: () => {},
      clearAll: () => {},
    };
  }
  return ctx;
}
