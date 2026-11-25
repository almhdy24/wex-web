import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      includeAssets: ['favicon.svg', 'favicon.png', 'robots.txt', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Wex Technology | ويكس تكنولوجي',
        short_name: 'Wex',
        description: 'متجر أجهزة لابتوب وهواتف محمولة وإلكترونيات في أم درمان، السودان',
        theme_color: '#061A55',
        background_color: '#EAF3FF',
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
        ],
        shortcuts: [
          {
            name: 'المتجر',
            short_name: 'المتجر',
            description: 'تصفح جميع الأجهزة',
            url: '/products',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'سلة المشتريات',
            short_name: 'السلة',
            description: 'عرض السلة وإتمام الطلب',
            url: '/cart',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'طلباتي',
            short_name: 'الطلبات',
            description: 'متابعة وتتبع الطلبات',
            url: '/orders',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        cacheId: `wex-pwa-${Date.now()}`,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin/],
        runtimeCaching: [
          {
            // Explicitly NEVER cache authenticated customer orders, admin, payment proofs or user profile
            urlPattern: ({ url }) => {
              const pathname = url.pathname;
              return pathname.includes('/admin') ||
                     pathname.includes('/me') ||
                     pathname.includes('/orders') ||
                     pathname.includes('/payment-proof');
            },
            handler: 'NetworkOnly',
          },
          {
            // Public catalog cached with StaleWhileRevalidate
            urlPattern: ({ url }) => {
              const pathname = url.pathname;
              return pathname.startsWith('/api/v1/products') ||
                     pathname.startsWith('/api/v1/categories') ||
                     pathname.startsWith('/api/v1/brands');
            },
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'wex-catalog-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12 // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Public shop metadata
            urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/shop'),
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
  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    globals: true
  }
});
