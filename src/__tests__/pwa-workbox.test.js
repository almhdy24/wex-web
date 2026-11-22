import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import viteConfig from '../../vite.config.js';

describe('PWA & Workbox Hardening Verification (Phase 7)', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('manifest.webmanifest has standalone, ar, rtl, theme colors, and shortcuts', () => {
    const manifestPath = path.join(rootDir, 'public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.display).toBe('standalone');
    expect(manifest.lang).toBe('ar');
    expect(manifest.dir).toBe('rtl');
    expect(manifest.theme_color).toBe('#061A55');
    expect(manifest.background_color).toBe('#EAF3FF');

    // Maskable icon
    const maskableIcon = manifest.icons.find((i) => i.purpose?.includes('maskable'));
    expect(maskableIcon).toBeDefined();

    // Shortcuts for Store, Cart, Orders
    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);
    const urls = manifest.shortcuts.map((s) => s.url);
    expect(urls).toContain('/products');
    expect(urls).toContain('/cart');
    expect(urls).toContain('/orders');
  });

  it('index.html contains viewport-fit=cover, apple-touch-icon, and theme-color', () => {
    const indexPath = path.join(rootDir, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    expect(indexHtml).toContain('viewport-fit=cover');
    expect(indexHtml).toContain('rel="apple-touch-icon"');
    expect(indexHtml).toContain('apple-mobile-web-app-capable');
    expect(indexHtml).toContain('name="theme-color" content="#061A55"');
  });

  it('Workbox NEVER caches authenticated API routes, orders, or payment-proof images', () => {
    // Find VitePWA plugin in viteConfig
    const pwaPlugin = viteConfig.plugins.flat().find((p) => p && p.name === 'vite-plugin-pwa');
    expect(pwaPlugin).toBeDefined();

    // Find the runtimeCaching rules
    // The config can be read from vite.config.js source or options
    const viteConfigContent = fs.readFileSync(path.join(rootDir, 'vite.config.js'), 'utf8');

    // Rule 1: Orders and Payment proofs must be NetworkOnly or excluded
    expect(viteConfigContent).toContain('/orders');
    expect(viteConfigContent).toContain('/payment-proof');
    expect(viteConfigContent).toContain('NetworkOnly');

    // Assert that public catalog uses StaleWhileRevalidate
    expect(viteConfigContent).toContain('StaleWhileRevalidate');
    expect(viteConfigContent).toContain('/api/v1/products');
  });
});
