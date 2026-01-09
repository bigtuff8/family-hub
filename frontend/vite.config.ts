import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['raspberrypi.tail30d2e6.ts.net', 'localhost', '192.168.68.66', '100.118.56.111'],
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      }
    }
  }
})