import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(<App />)

// Service worker keeps audio alive when the tab is backgrounded on Android
// Chrome (PWA install recommended). Register only in production — caching in
// dev causes stale builds.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // updateViaCache: 'none' — always re-check sw.js from the network so
    // service-worker updates deploy without users clearing their cache.
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {})
  })
}