import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load .env / .env.[mode]; all keys (not only VITE_*) so config can read PORT.
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_PORT || env.PORT || 5555)

  return {
    plugins: [react()],
    server: {
      host: true,
      port,
    },
    preview: {
      host: true,
      port,
    },
  }
})
