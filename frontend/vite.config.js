import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // ✅ This forces Vite to check for changes manually
      usePolling: true,
    },
    host: true, // Needed for Docker
    port: 5173,
    strictPort: true,
  },
})
