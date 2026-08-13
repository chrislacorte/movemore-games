import { cpSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = join(gameRoot, '../..')
const srcDir = [
  join(gameRoot, 'node_modules/@mediapipe/hands'),
  join(workspaceRoot, 'node_modules/@mediapipe/hands'),
].find((dir) => existsSync(dir))
const root = gameRoot
const destDir = join(root, 'public/mediapipe/hands')

if (!srcDir) {
  console.warn('[copy-mediapipe] @mediapipe/hands not installed — skipping')
  process.exit(0)
}

mkdirSync(destDir, { recursive: true })

for (const file of readdirSync(srcDir)) {
  if (file === 'package.json' || file === 'README.md' || file === 'index.d.ts') continue
  cpSync(join(srcDir, file), join(destDir, file), { force: true })
}

console.log('[copy-mediapipe] MediaPipe Hands assets copied to public/mediapipe/hands')
