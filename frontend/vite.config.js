import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxying API requests to the backend
      '/api': {
        target: 'http://localhost:5001', // Your backend server URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});