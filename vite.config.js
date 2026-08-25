import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from https://<owner>.github.io/rytc-behavior-score/ via GitHub Pages.
export default defineConfig({
  base: '/rytc-behavior-score/',
  plugins: [react()],
})
