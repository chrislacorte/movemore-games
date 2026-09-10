import { cpSync, existsSync, mkdirSync, readdirSync, createWriteStream, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'
import { get } from 'https'

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = join(gameRoot, '../..')
const wasmDest = join(gameRoot, 'public/mediapipe/wasm')
const modelDest = join(gameRoot, 'public/mediapipe/models')
const modelFile = join(modelDest, 'hand_landmarker.task')

// Full-precision hand landmarker (float16 weights). Highest landmark accuracy MediaPipe ships.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task'

function findPackageDir() {
  return [
    join(gameRoot, 'node_modules/@mediapipe/tasks-vision'),
    join(workspaceRoot, 'node_modules/@mediapipe/tasks-vision'),
  ].find((dir) => existsSync(dir))
}

function copyWasm(srcDir) {
  const wasmSrc = join(srcDir, 'wasm')
  if (!existsSync(wasmSrc)) {
    console.warn('[copy-mediapipe] wasm folder not found in tasks-vision')
    return
  }
  mkdirSync(wasmDest, { recursive: true })
  for (const file of readdirSync(wasmSrc)) {
    cpSync(join(wasmSrc, file), join(wasmDest, file), { force: true })
  }
  console.log('[copy-mediapipe] WASM copied to public/mediapipe/wasm')
}

function fetchUrl(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && redirects < 5) {
        fetchUrl(res.headers.location, redirects + 1).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Model download failed: ${res.statusCode}`))
        return
      }
      resolve(res)
    }).on('error', reject)
  })
}

async function downloadModel() {
  if (existsSync(modelFile)) {
    console.log('[copy-mediapipe] Model already present')
    return
  }
  // Reuse a sibling game's model if it already downloaded one.
  const siblings = ['snake', 'pacman', 'tetris', 'lightpainter'].map((g) =>
    join(workspaceRoot, 'games', g, 'public/mediapipe/models/hand_landmarker.task'),
  )
  const local = siblings.find((p) => existsSync(p))
  mkdirSync(modelDest, { recursive: true })
  if (local) {
    cpSync(local, modelFile)
    console.log('[copy-mediapipe] Model copied from sibling game')
    return
  }
  console.log('[copy-mediapipe] Downloading hand_landmarker.task…')
  try {
    const res = await fetchUrl(MODEL_URL)
    await pipeline(res, createWriteStream(modelFile))
    console.log('[copy-mediapipe] Model saved to public/mediapipe/models')
  } catch (err) {
    if (existsSync(modelFile)) unlinkSync(modelFile)
    console.warn('[copy-mediapipe] Download failed:', err.message)
  }
}

const pkgDir = findPackageDir()
if (!pkgDir) {
  console.warn('[copy-mediapipe] @mediapipe/tasks-vision not installed — run npm install first')
  process.exit(0)
}

copyWasm(pkgDir)
await downloadModel()
