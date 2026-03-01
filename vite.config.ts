import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
          utils: ['date-fns'],
        },
      },
    },
    cssCodeSplit: true, // Separa CSS en chunks
  },
  server: {
    host: true,
  },
})
