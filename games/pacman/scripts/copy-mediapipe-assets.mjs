import { cpSync, existsSync, mkdirSync, readdirSync, createWriteStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'
import { get } from 'https'

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = join(gameRoot, '../..')
const root = gameRoot
const wasmDest = join(root, 'public/mediapipe/wasm')
const modelDest = join(root, 'public/mediapipe/models')
const modelFile = join(modelDest, 'hand_landmarker.task')

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

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

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchUrl(res.headers.location).then(resolve).catch(reject)
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
  mkdirSync(modelDest, { recursive: true })
  console.log('[copy-mediapipe] Downloading hand_landmarker.task…')
  const res = await fetchUrl(MODEL_URL)
  await pipeline(res, createWriteStream(modelFile))
  console.log('[copy-mediapipe] Model saved to public/mediapipe/models')
}

const pkgDir = findPackageDir()
if (!existsSync(pkgDir)) {
  console.warn('[copy-mediapipe] @mediapipe/tasks-vision not installed — run npm install first')
  process.exit(0)
}

copyWasm(pkgDir)
await downloadModel()
