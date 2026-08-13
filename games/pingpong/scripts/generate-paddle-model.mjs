/**
 * Generates a simple ping pong paddle GLB for Three.js.
 * Run: node scripts/generate-paddle-model.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = class Blob {
    constructor(parts = []) {
      this.parts = parts
    }
    arrayBuffer() {
      const bufs = this.parts.map((p) =>
        Buffer.isBuffer(p) ? p : Buffer.from(p),
      )
      return Promise.resolve(Buffer.concat(bufs).buffer)
    }
  }
}

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf
        this.onloadend?.({ target: this })
      })
    }
  }
}

const THREE = await import('three')
const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/models')
const outPath = path.join(outDir, 'ping_pong_paddle.glb')

fs.mkdirSync(outDir, { recursive: true })

const scene = new THREE.Scene()
const paddle = new THREE.Group()
paddle.name = 'PingPongPaddle'

const rubberMat = new THREE.MeshStandardMaterial({
  color: 0xe83828,
  roughness: 0.45,
  metalness: 0.05,
})

const woodMat = new THREE.MeshStandardMaterial({
  color: 0x8b5a2b,
  roughness: 0.72,
  metalness: 0.02,
})

const blade = new THREE.Mesh(
  new THREE.BoxGeometry(0.16, 0.11, 0.018, 4, 4, 1),
  rubberMat,
)
blade.name = 'Blade'
blade.position.set(0, 0.09, 0)
paddle.add(blade)

const handle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.014, 0.017, 0.13, 16),
  woodMat,
)
handle.name = 'Handle'
handle.position.set(0, -0.02, 0)
paddle.add(handle)

const guard = new THREE.Mesh(
  new THREE.TorusGeometry(0.02, 0.004, 8, 24),
  woodMat,
)
guard.name = 'Guard'
guard.rotation.x = Math.PI / 2
guard.position.set(0, 0.025, 0)
paddle.add(guard)

scene.add(paddle)

const exporter = new GLTFExporter()

await new Promise((resolve, reject) => {
  exporter.parse(
    scene,
    (result) => {
      try {
        fs.writeFileSync(outPath, Buffer.from(result))
        console.log(`Wrote paddle model to ${outPath} (${fs.statSync(outPath).size} bytes)`)
        resolve()
      } catch (err) {
        reject(err)
      }
    },
    (error) => reject(error),
    { binary: true },
  )
})
