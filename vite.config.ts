import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name:             'Costa Sol · Fastighetsportfölj',
        short_name:       'Costa Sol',
        description:      'Fastighetsportfölj och investeringsanalys för Costa del Sol',
        theme_color:      '#0a0a0a',
        background_color: '#0a0a0a',
        display:          'standalone',
        orientation:      'portrait',
        scope:            '/',
        start_url:        '/',
        lang:             'sv-SE',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png'                       },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png'                       },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'  },
        ],
      },
      workbox: {
        // Cache-strategier per resurstyp
        runtimeCaching: [
          // Google Fonts: cacha för längre tid (sällan ändras)
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com'
                                 || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Supabase API: nätverk först, faller tillbaka till cache när offline
          {
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Frankfurter (valutakurser): cacha mer aggressivt
          {
            urlPattern: ({ url }) => url.hostname === 'api.frankfurter.app',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'currency-rates',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 4 },
            },
          },
        ],
        // Skippa cache av Edge Functions och stora payloads
        navigateFallbackDenylist: [/^\/functions\//],
      },
      devOptions: {
        enabled: false,  // sätt true om du vill testa SW under utveckling
      },
    }),
  ],
})
