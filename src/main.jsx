import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/tokens.css';
import './styles/global.css';

// Ensure dev mode never serves or caches stale Service Worker builds (unless VITE_DEV_SW=1 for push testing)
if (import.meta.env.DEV && import.meta.env.VITE_DEV_SW !== '1' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  if ('caches' in window) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
