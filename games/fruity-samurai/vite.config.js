import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/fruitysamurai/'

export default defineConfig({
  base,
  optimizeDeps: {
    exclude: ['@mediapipe/hands'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*'],
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,woff2,otf,mp3,wav,wasm,data,binarypb,tflite}',
        ],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/fruitysamurai\/mediapipe/, /^\/fruitysamurai\/assets/],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Fruity Samurai',
        short_name: 'Fruity Samurai',
        description: 'Slice fruits with your hands — playable offline.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        start_url: base,
        scope: base,
        icons: [
          {
            src: `${base}img/game-intro.png`,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: `${base}img/game-intro.png`,
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
