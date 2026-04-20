import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), svgr()],
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@courses': path.resolve(__dirname, 'courses'),
    },
  },
})