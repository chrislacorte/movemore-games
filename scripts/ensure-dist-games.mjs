#!/usr/bin/env node
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = path.join(root, 'dist')

const GAME_SLUGS = ['fruitysamurai', 'fruitysamurai-proto', 'fruitninja3d', 'pingpong', 'shooter', 'snake', 'pacman', 'tetris', 'lightpainter']

const missing = GAME_SLUGS.filter(
  (slug) => !existsSync(path.join(distRoot, slug, 'index.html')),
)

if (missing.length === 0) {
  process.exit(0)
}

console.warn(
  `[dev] Missing built games in dist/: ${missing.join(', ')}`,
)
console.warn('[dev] Run `npm run build:all` once so landing page game links work locally.')
