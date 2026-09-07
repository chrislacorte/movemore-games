import * as THREE from 'three'
import { PLAY } from '../game/tuning'

function parchmentTexture(): THREE.CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#efe4cc'
  ctx.fillRect(0, 0, size, size)
  const img = ctx.getImageData(0, 0, size, size)
  const data = img.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.sin(i * 0.00013) + Math.cos(i * 0.00037)) * 6
    data[i] = Math.min(255, data[i] + n)
    data[i + 1] = Math.min(255, data[i + 1] + n * 0.7)
    data[i + 2] = Math.min(255, data[i + 2] + n * 0.35)
  }
  ctx.putImageData(img, 0, 0)
  ctx.fillStyle = 'rgba(18,12,9,0.07)'
  for (let i = 0; i < 90; i += 1) {
    const x = Math.random() * size
    const y = Math.random() * size
    ctx.beginPath()
    ctx.ellipse(x, y, 1 + Math.random() * 4, 0.6 + Math.random() * 2, Math.random() * 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = 'rgba(18,12,9,0.18)'
  ctx.lineWidth = 18
  ctx.lineCap = 'round'
  ;[
    [80, 180, 280, 420],
    [760, 120, 940, 360],
    [120, 780, 340, 940],
    [700, 720, 960, 880],
  ].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo((x1 + x2) / 2 + 40, (y1 + y2) / 2 - 30, x2, y2)
    ctx.stroke()
  })
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function createDojo(): THREE.Group {
  const root = new THREE.Group()
  const paper = parchmentTexture()

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(PLAY.width * 1.85, PLAY.height * 1.65),
    new THREE.MeshStandardMaterial({
      map: paper,
      color: '#f3ead6',
      roughness: 0.92,
      metalness: 0,
    }),
  )
  wall.position.set(0, 0.12, PLAY.wallZ)
  root.add(wall)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(PLAY.width * 1.9, 9),
    new THREE.MeshStandardMaterial({ color: '#1a120c', roughness: 0.9 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, -PLAY.height * 0.52, 1.2)
  root.add(floor)

  const beamMat = new THREE.MeshStandardMaterial({ color: '#120c09', roughness: 0.7 })
  ;[-PLAY.width * 0.78, PLAY.width * 0.78].forEach((x) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.22, PLAY.height * 1.5, 0.22), beamMat)
    beam.position.set(x, 0.1, PLAY.wallZ + 0.1)
    root.add(beam)
  })

  const divider = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, PLAY.height * 1.35, 0.06),
    new THREE.MeshBasicMaterial({ color: '#120c09' }),
  )
  divider.name = 'versus-divider'
  divider.position.set(0, 0.05, PLAY.wallZ + 0.18)
  divider.visible = false
  root.add(divider)

  return root
}
