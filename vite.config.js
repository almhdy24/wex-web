import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Wex Technology | ويكس تكنولوجي',
        short_name: 'Wex',
        description: 'متجر أجهزة لابتوب وهواتف ذكية وإلكترونيات في أم درمان، السودان',
        theme_color: '#061A55',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait-primary',
        dir: 'rtl',
        lang: 'ar',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin/],
        runtimeCaching: [
          {
            // Only cache explicitly public shop metadata, categories and brands with NetworkFirst. Never cache admin or customer orders.
            urlPattern: ({ url }) => {
              const pathname = url.pathname;
              if (pathname.includes('/admin') || pathname.includes('/me') || pathname.includes('/orders')) {
                return false;
              }
              return pathname.startsWith('/api/v1/shop') ||
                     pathname.startsWith('/api/v1/categories') ||
                     pathname.startsWith('/api/v1/brands');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'wex-public-api-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Public product images
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/products/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'wex-product-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5371,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'node',
    globals: true
  }
});
