/**
 * Generates minimal placeholder WAV files for shoot + reload.
 * Run: node scripts/generate-placeholder-sounds.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/sounds')

function writeWav(filePath, { freq = 440, duration = 0.2, type = 'sine', decay = 0.92 }) {
  const sampleRate = 44100
  const numSamples = Math.floor(sampleRate * duration)
  const dataSize = numSamples * 2
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  let amp = 0.85
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    let sample = 0
    if (type === 'noise') {
      sample = (Math.random() * 2 - 1) * amp
    } else if (type === 'click') {
      sample = Math.sin(2 * Math.PI * freq * t) * amp
      if (i < numSamples * 0.08) sample += (Math.random() * 2 - 1) * amp * 0.6
    } else {
      sample = Math.sin(2 * Math.PI * freq * t) * amp
    }
    amp *= decay
    const clamped = Math.max(-1, Math.min(1, sample))
    buffer.writeInt16LE(Math.floor(clamped * 32767), 44 + i * 2)
  }

  fs.writeFileSync(filePath, buffer)
}

fs.mkdirSync(outDir, { recursive: true })
writeWav(path.join(outDir, 'shoot.wav'), {
  freq: 180,
  duration: 0.14,
  type: 'click',
  decay: 0.88,
})
writeWav(path.join(outDir, 'reload.wav'), {
  freq: 520,
  duration: 0.22,
  type: 'sine',
  decay: 0.96,
})
console.log('Wrote placeholder sounds to public/sounds/')
