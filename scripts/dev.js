// Runs the presence backend + Vite dev server together (zero dependencies).
// npm run dev → server.js on :8787, Vite on :5173 (proxying /api → :8787).

import { spawn } from 'node:child_process'

const server = spawn(process.execPath, ['server.js'], { stdio: 'inherit' })
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' })

const shutdown = () => {
  server.kill()
  vite.kill()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
server.on('exit', () => vite.kill())
vite.on('exit', () => server.kill())