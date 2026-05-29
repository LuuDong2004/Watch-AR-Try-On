// Copy the DeepAR SDK runtime assets (ML models + WASM + dynamic modules) into
// public/deepar so the app can self-host them. DeepAR's default rootPath points
// at the JsDelivr CDN, which is slow/unreliable in some regions and makes
// switchEffect() hang while it tries to download the wrist-tracking model.
// Serving these from our own origin (Vercel) fixes that.
//
// Runs automatically via the "predev" / "prebuild" npm hooks. Skips the copy
// when the destination already holds the same SDK version.
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const src = path.resolve(root, 'node_modules/deepar')
const dest = path.resolve(root, 'public/deepar')

// Only the runtime files DeepAR fetches at runtime — not the bundled js/*.esm
// (that is already imported through the app bundle) nor package metadata.
const ENTRIES = [
  'models',
  'wasm',
  'mediaPipe',
  'effects',
  'js/dynamicModules',
  'default_envmap.webp',
  'split_sum.webp',
  'file_sizes.json',
  'VERSION.txt',
]

async function readVersion(file) {
  try {
    return (await readFile(file, 'utf8')).trim()
  } catch {
    return ''
  }
}

export async function copyDeepar() {
  if (!existsSync(src)) {
    console.error('[copy-deepar] node_modules/deepar not found — run npm install first')
    return
  }

  const srcVer = await readVersion(path.join(src, 'VERSION.txt'))
  const destVer = await readVersion(path.join(dest, 'VERSION.txt'))
  if (srcVer && srcVer === destVer) {
    console.log(`[copy-deepar] up to date (${srcVer})`)
    return
  }

  await mkdir(dest, { recursive: true })
  for (const entry of ENTRIES) {
    const from = path.join(src, entry)
    if (!existsSync(from)) continue
    const to = path.join(dest, entry)
    await mkdir(path.dirname(to), { recursive: true })
    await cp(from, to, { recursive: true })
  }
  // Stamp version last so an interrupted copy doesn't look complete.
  await writeFile(path.join(dest, 'VERSION.txt'), srcVer)
  console.log(`[copy-deepar] copied DeepAR ${srcVer} assets -> public/deepar`)
}

// Allow running directly (npm hook) as well as importing into vite.config.js.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('copy-deepar.mjs')) {
  copyDeepar()
}
