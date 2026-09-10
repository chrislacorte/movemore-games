#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distRoot = path.join(root, 'dist')

const targets = ['landing', 'fruitysamurai', 'fruitysamurai-proto', 'fruitninja3d', 'pingpong', 'shooter', 'snake', 'pacman', 'tetris', 'lightpainter']

fs.rmSync(distRoot, { recursive: true, force: true })
fs.mkdirSync(distRoot, { recursive: true })

for (const target of targets) {
  const result = spawnSync('node', ['scripts/build-game.mjs', target], {
    cwd: root,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('All builds merged into dist/')
