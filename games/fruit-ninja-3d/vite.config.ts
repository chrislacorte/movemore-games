import { defineConfig } from 'vite'

export default defineConfig({
  base: '/fruitninja3d/',
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          mediapipe: ['@mediapipe/tasks-vision'],
        },
      },
    },
  },
})
