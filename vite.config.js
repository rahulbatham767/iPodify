import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { watch } from 'node:fs'

// Auto-restart the dev server when .env files change so env updates
// (API key, playlist IDs, live stream) take effect without a manual restart.
function envReload() {
  let timer = null
  return {
    name: 'env-reload',
    configureServer(server) {
      const watcher = watch(['.env', '.env.local', '.env.development', '.env.production'], () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          server.restart()
        }, 150)
      })
      server.httpServer?.once('close', () => {
        clearTimeout(timer)
        watcher.close()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), envReload()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})