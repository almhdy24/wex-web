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

    // Verify injectManifest strategy in vite.config.js
    const viteConfigContent = fs.readFileSync(path.join(rootDir, 'vite.config.js'), 'utf8');
    expect(viteConfigContent).toContain("strategies: 'injectManifest'");
    expect(viteConfigContent).toContain("filename: 'sw.js'");

    // Verify runtime caching rules in src/sw.js
    const swContent = fs.readFileSync(path.join(rootDir, 'src/sw.js'), 'utf8');
    expect(swContent).toContain('/orders');
    expect(swContent).toContain('/payment-proof');
    expect(swContent).toContain('/push/');
    expect(swContent).toContain('NetworkOnly');
    expect(swContent).toContain('StaleWhileRevalidate');
    expect(swContent).toContain('/api/v1/products');

    // NET-01: product/price/stock responses are network-first with a short cache cap
    // (previously stale-while-revalidate for 12 hours).
    const productRule = swContent.slice(swContent.indexOf("startsWith('/api/v1/products')"));
    expect(productRule.slice(0, 400)).toContain('NetworkFirst');
    const m = swContent.match(/PRODUCT_CACHE_MAX_AGE_SECONDS = ([0-9* ]+);/);
    expect(m).not.toBeNull();
    // eslint-disable-next-line no-eval
    expect(eval(m[1])).toBeLessThanOrEqual(15 * 60);
    expect(swContent).not.toMatch(/60 \* 60 \* 12/);
  });
});
