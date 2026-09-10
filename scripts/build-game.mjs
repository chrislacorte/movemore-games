#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const GAMES = {
  landing: {
    workspace: '@movemore/landing',
    dir: 'apps/landing',
    outSlug: null,
  },
  fruitysamurai: {
    workspace: '@movemore/fruity-samurai',
    dir: 'games/fruity-samurai',
    outSlug: 'fruitysamurai',
  },
  'fruitysamurai-proto': {
    workspace: '@movemore/fruity-samurai-proto',
    dir: 'games/fruity-samurai-proto',
    outSlug: 'fruitysamurai-proto',
  },
  fruitninja3d: {
    workspace: '@movemore/fruit-ninja-3d',
    dir: 'games/fruit-ninja-3d',
    outSlug: 'fruitninja3d',
  },
  pingpong: {
    workspace: '@movemore/pingpong',
    dir: 'games/pingpong',
    outSlug: 'pingpong',
  },
  shooter: {
    workspace: '@movemore/shooter',
    dir: 'games/shooter',
    outSlug: 'shooter',
  },
  snake: {
    workspace: '@movemore/snake',
    dir: 'games/snake',
    outSlug: 'snake',
  },
  pacman: {
    workspace: '@movemore/pacman',
    dir: 'games/pacman',
    outSlug: 'pacman',
  },
  tetris: {
    workspace: '@movemore/tetris',
    dir: 'games/tetris',
    outSlug: 'tetris',
  },
  lightpainter: {
    workspace: '@movemore/lightpainter',
    dir: 'games/lightpainter',
    outSlug: 'lightpainter',
  },
}

const target = process.argv[2]
if (!target || !GAMES[target]) {
  console.error(`Usage: node scripts/build-game.mjs <${Object.keys(GAMES).join('|')}>`)
  process.exit(1)
}

const game = GAMES[target]
const gameDir = path.join(root, game.dir)
const buildDir = path.join(gameDir, 'dist')

console.log(`Building ${target}…`)
const result = spawnSync('npm', ['run', 'build', '-w', game.workspace], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

const distRoot = path.join(root, 'dist')
fs.mkdirSync(distRoot, { recursive: true })

if (game.outSlug === null) {
  copyDir(buildDir, distRoot)
} else {
  const outDir = path.join(distRoot, game.outSlug)
  fs.rmSync(outDir, { recursive: true, force: true })
  copyDir(buildDir, outDir)
}

writeCloudflareConfig(distRoot)
console.log(`Built ${target} → dist${game.outSlug ? `/${game.outSlug}` : ''}/`)

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function writeCloudflareConfig(distRoot) {
  const redirects = `/fruitysamurai-proto/*  /fruitysamurai-proto/index.html  200
/fruitysamurai/*  /fruitysamurai/index.html  200
/fruitninja3d/*   /fruitninja3d/index.html   200
/pingpong/*       /pingpong/index.html       200
/shooter/*        /shooter/index.html        200
/snake/*          /snake/index.html          200
/pacman/*         /pacman/index.html         200
/tetris/*         /tetris/index.html         200
/lightpainter/*   /lightpainter/index.html   200
/*                /index.html                200
`
  fs.writeFileSync(path.join(distRoot, '_redirects'), redirects)

  const headers = `/sw.js
  Cache-Control: no-cache

/workbox-*.js
  Cache-Control: no-cache

/manifest.webmanifest
  Cache-Control: public, max-age=86400
  Content-Type: application/manifest+json

/fruitysamurai/sw.js
  Cache-Control: no-cache

/fruitysamurai/workbox-*.js
  Cache-Control: no-cache

/fruitysamurai/manifest.webmanifest
  Cache-Control: public, max-age=86400
  Content-Type: application/manifest+json

/fruitysamurai/mediapipe/hands/*.wasm
  Content-Type: application/wasm

/fruitysamurai-proto/mediapipe/hands/*.wasm
  Content-Type: application/wasm

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fruitysamurai/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fruitysamurai-proto/sw.js
  Cache-Control: no-cache

/fruitysamurai-proto/workbox-*.js
  Cache-Control: no-cache

/fruitysamurai-proto/manifest.webmanifest
  Cache-Control: public, max-age=86400
  Content-Type: application/manifest+json

/fruitysamurai-proto/mediapipe/hands/*.wasm
  Content-Type: application/wasm

/fruitysamurai-proto/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fruitysamurai-proto/models/*.glb
  Content-Type: model/gltf-binary
  Cache-Control: public, max-age=31536000, immutable

/fruitninja3d/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fruitninja3d/mediapipe/wasm/*.wasm
  Content-Type: application/wasm

/fruitninja3d/mediapipe/models/*.task
  Content-Type: application/octet-stream
  Cache-Control: public, max-age=31536000, immutable

/fruitninja3d/models/fruits/*.glb
  Content-Type: model/gltf-binary
  Cache-Control: public, max-age=31536000, immutable

/fruitninja3d/draco/*.wasm
  Content-Type: application/wasm

/pingpong/assets/*
  Cache-Control: public, max-age=31536000, immutable

/shooter/assets/*
  Cache-Control: public, max-age=31536000, immutable

/snake/assets/*
  Cache-Control: public, max-age=31536000, immutable

/pacman/assets/*
  Cache-Control: public, max-age=31536000, immutable

/tetris/assets/*
  Cache-Control: public, max-age=31536000, immutable

/lightpainter/assets/*
  Cache-Control: public, max-age=31536000, immutable

/snake/mediapipe/wasm/*.wasm
  Content-Type: application/wasm

/pacman/mediapipe/wasm/*.wasm
  Content-Type: application/wasm

/tetris/mediapipe/wasm/*.wasm
  Content-Type: application/wasm

/lightpainter/mediapipe/wasm/*.wasm
  Content-Type: application/wasm

/pingpong/models/*.glb
  Content-Type: model/gltf-binary
  Cache-Control: public, max-age=31536000, immutable

/pingpong/sounds/*.mp3
  Content-Type: audio/mpeg
  Cache-Control: public, max-age=31536000, immutable

/shooter/sounds/*.mp3
  Content-Type: audio/mpeg
  Cache-Control: public, max-age=31536000, immutable
`
  fs.writeFileSync(path.join(distRoot, '_headers'), headers)
}
