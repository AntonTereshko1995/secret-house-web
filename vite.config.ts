import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'

export default defineConfig({
  plugins: [
    react(),
    vitePrerenderPlugin({
      renderTarget: '#root',
      additionalPrerenderRoutes: ['/availability'],
    }),
  ],
  build: {
    sourcemap: true,
  },
})
