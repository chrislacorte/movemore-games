import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const root = path.join(import.meta.dirname, '../public/backgrounds')
const previews = path.join(root, 'previews')

const files = fs.readdirSync(root).filter((f) => f.endsWith('.jpg'))

for (const file of files) {
  const id = file.replace(/\.jpg$/, '')
  const input = path.join(root, file)

  const mainOut = path.join(root, `${id}.webp`)
  await sharp(input)
    .resize(1600, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(mainOut)

  const previewOut = path.join(previews, `${id}.webp`)
  await sharp(input)
    .resize(480, null, { withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(previewOut)

  const mainSize = fs.statSync(mainOut).size
  const previewSize = fs.statSync(previewOut).size
  console.log(`${id}: ${mainSize} main / ${previewSize} preview`)

  fs.unlinkSync(input)
  const oldPreview = path.join(previews, file)
  if (fs.existsSync(oldPreview)) fs.unlinkSync(oldPreview)
}
