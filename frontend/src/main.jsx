import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// After a new deploy, a browser holding a cached index.html may request old,
// now-deleted chunk files. Vercel's SPA fallback serves index.html for them,
// producing a "Failed to fetch dynamically imported module" / MIME error.
// Reload once to pull the fresh index + chunk map. A sessionStorage guard
// prevents an infinite reload loop if the failure is not stale-cache related.
const RELOAD_FLAG = 'chunk-reloaded'
function recoverFromStaleChunk() {
  if (sessionStorage.getItem(RELOAD_FLAG)) return
  sessionStorage.setItem(RELOAD_FLAG, '1')
  window.location.reload()
}
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  recoverFromStaleChunk()
})
window.addEventListener('error', (e) => {
  const msg = e?.message || ''
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    (msg.includes('module script') && msg.includes('MIME'))
  ) {
    recoverFromStaleChunk()
  }
})
// Clear the guard once the app has loaded successfully.
window.addEventListener('load', () => {
  setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG), 3000)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
