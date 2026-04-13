import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    plugins: [react(), tailwindcss()],
    // GitHub Pages serves under /<repo-name>/ — set via VITE_BASE_PATH env
    base: process.env.VITE_BASE_PATH ?? '/',
    server: isDev ? {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    } : {},
  }
})
