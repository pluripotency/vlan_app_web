import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import config from './config.ts'

// https://vite.dev/config/
export default defineConfig({
  base: config.url_root,
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    emptyOutDir: true,
    outDir: './dist'
  }
})
