import { cpSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = join(gameRoot, '../..')
const dest = join(gameRoot, 'public/draco')

const src = [
  join(gameRoot, 'node_modules/three/examples/jsm/libs/draco'),
  join(workspaceRoot, 'node_modules/three/examples/jsm/libs/draco'),
].find((dir) => existsSync(dir))

if (!src) {
  console.warn('[copy-draco] three not installed — run npm install first')
  process.exit(0)
}

mkdirSync(dest, { recursive: true })
for (const file of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
  cpSync(join(src, file), join(dest, file), { force: true })
}
console.log('[copy-draco] Draco decoder copied to public/draco')
