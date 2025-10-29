import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,      // Use port 3002 to avoid conflicts
    host: true,
    https: false, // Can be set to true if needed for geolocation
    watch: {
      usePolling: true, // Enable polling for better file watching on macOS
      interval: 1000    // Check for changes every 1 second
    },
    hmr: {
      overlay: false,   // Disable error overlay that can interfere with HMR
      port: 3003       // Use port 3003 for HMR websocket
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'leaflet'] // Pre-bundle these dependencies
  }
})