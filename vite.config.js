import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      // Permette di importare i sentieri con @courses/nomefile
      '@courses': path.resolve(__dirname, 'courses'),
    },
  },
})