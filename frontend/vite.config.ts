import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Send /api calls to the FastAPI backend so the session cookie works in dev.
    proxy: { '/api': 'http://localhost:8000' },
  },
})
