import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const src = dirname(require.resolve('@mediapipe/hands/hands.js'))
const dest = join(process.cwd(), 'public/mediapipe/hands')
if (!existsSync(src)) throw new Error('Missing @mediapipe/hands')
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })
console.log(`copied MediaPipe Hands -> ${dest}`)
