// Dev helper: renders all trace templates into an SVG contact sheet so the
// polyline geometry can be checked visually. Run with:
//   node scripts/preview-templates.mjs > /tmp/templates.svg
import { TEMPLATES } from '../src/constants/templates.js'

const CELL = 120
const PAD = 14
const COLS = 9
const rows = Math.ceil(TEMPLATES.length / COLS)

let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * CELL}" height="${rows * CELL}" style="background:#0a0a24">`

TEMPLATES.forEach((t, i) => {
  const ox = (i % COLS) * CELL + PAD
  const oy = Math.floor(i / COLS) * CELL + PAD
  const s = CELL - PAD * 2
  for (const stroke of t.strokes) {
    const pts = stroke.map(([x, y]) => `${(ox + x * s).toFixed(1)},${(oy + y * s).toFixed(1)}`).join(' ')
    out += `<polyline points="${pts}" fill="none" stroke="#7fdfff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
  }
  out += `<text x="${ox}" y="${oy + s + 10}" fill="#888" font-size="9" font-family="sans-serif">${t.id}</text>`
})

out += '</svg>'
process.stdout.write(out)
