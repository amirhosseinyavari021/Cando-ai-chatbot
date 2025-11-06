import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // FIX: Added server proxy configuration
  server: {
    proxy: {
      // Proxies any request starting with /api to the backend server
      '/api': {
        target: 'http://localhost:5000', // Assumes your backend runs on port 5000
        changeOrigin: true, // Recommended for virtual hosts
      },
    },
  },
})