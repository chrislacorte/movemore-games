import { createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distRoot = path.resolve(__dirname, '../../dist')

const GAME_SLUGS = ['fruitysamurai', 'pingpong', 'shooter', 'snake', 'pacman', 'tetris', 'lightpainter']

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.task': 'application/octet-stream',
  '.binarypb': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary',
}

let warnedMissingDist = false

function serveDistGames() {
  return {
    name: 'serve-dist-games',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''

        for (const slug of GAME_SLUGS) {
          const prefix = `/${slug}`
          const isExact = url === prefix
          const isNested = url.startsWith(`${prefix}/`)
          if (!isExact && !isNested) continue

          const gameDir = path.join(distRoot, slug)
          if (!existsSync(gameDir)) {
            if (!warnedMissingDist) {
              warnedMissingDist = true
              console.warn(
                '[landing dev] dist/ games missing — run `npm run build:all` so game links work.',
              )
            }
            return next()
          }

          const relPath =
            isExact || url === `${prefix}/`
              ? 'index.html'
              : url.slice(prefix.length + 1)

          const filePath = path.join(gameDir, relPath)
          if (existsSync(filePath) && statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase()
            res.setHeader('Content-Type', MIME_TYPES[ext] ?? 'application/octet-stream')
            createReadStream(filePath).pipe(res)
            return
          }

          const indexPath = path.join(gameDir, 'index.html')
          if (existsSync(indexPath) && !path.extname(relPath)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            createReadStream(indexPath).pipe(res)
            return
          }

          res.statusCode = 404
          res.end('Not found')
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveDistGames()],
})
