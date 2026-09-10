#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const VALID = new Set(['all', 'landing', 'fruitysamurai', 'fruitysamurai-proto', 'fruitninja3d', 'pingpong', 'shooter', 'snake', 'pacman', 'tetris', 'lightpainter'])
const target = process.argv[2] ?? 'all'

if (!VALID.has(target)) {
  console.error(`Usage: node scripts/deploy.mjs <${[...VALID].join('|')}>`)
  process.exit(1)
}

if (target === 'all') {
  const build = spawnSync('node', ['scripts/build-all.mjs'], {
    cwd: root,
    stdio: 'inherit',
  })
  if (build.status !== 0) process.exit(build.status ?? 1)
} else {
  const distRoot = path.join(root, 'dist')
  if (!fs.existsSync(distRoot)) {
    console.warn('dist/ missing — run deploy:all first for a full site.')
  }
  const build = spawnSync('node', ['scripts/build-game.mjs', target], {
    cwd: root,
    stdio: 'inherit',
  })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

const deploy = spawnSync(
  'npx',
  ['wrangler', 'pages', 'deploy', './dist', '--project-name=movemore-games'],
  { cwd: root, stdio: 'inherit', shell: true },
)

process.exit(deploy.status ?? 1)
