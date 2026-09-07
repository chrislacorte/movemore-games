import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/fruitysamurai/'

export default defineConfig({
  base,
  optimizeDeps: {
    exclude: ['@mediapipe/hands'],
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,woff2,otf,mp3,wav,mp4,glb,wasm,data,tflite,binarypb}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/fruitysamurai\/mediapipe/, /^\/fruitysamurai\/assets/],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Fruity Samurai',
        short_name: 'Fruity Samurai',
        description: 'Slice flying fruit. Playable offline.',
        theme_color: '#120c09',
        background_color: '#120c09',
        display: 'fullscreen',
        start_url: base,
        scope: base,
      },
    }),
  ],
})
