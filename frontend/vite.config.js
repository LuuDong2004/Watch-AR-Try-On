import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyDeepar } from './scripts/copy-deepar.mjs'

// Copy DeepAR SDK assets into public/deepar before build/dev so they are
// self-hosted (see scripts/copy-deepar.mjs). Done as a Vite plugin so it runs
// no matter how the build is invoked (e.g. Vercel may call `vite build`
// directly, bypassing the npm "prebuild" hook).
function deeparAssets() {
  return {
    name: 'copy-deepar-assets',
    async buildStart() {
      await copyDeepar()
    },
    async configureServer() {
      await copyDeepar()
    },
  }
}

export default defineConfig({
  plugins: [react(), deeparAssets()],
  server: {
    host: true,
    port: 5173
  },
})
