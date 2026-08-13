import * as THREE from 'three'

const TABLE_W = 1.525
const TABLE_L = 2.74
const TOP_H = 0.052
const APRON = 0.09

function addApron(table, mat) {
  const y = -TOP_H * 0.35
  const specs = [
    [TABLE_W + APRON * 2, 0.1, 0.07, 0, y, TABLE_L / 2 + 0.03],
    [TABLE_W + APRON * 2, 0.1, 0.07, 0, y, -TABLE_L / 2 - 0.03],
    [0.07, 0.1, TABLE_L + APRON * 1.4, -TABLE_W / 2 - 0.03, y, 0],
    [0.07, 0.1, TABLE_L + APRON * 1.4, TABLE_W / 2 + 0.03, y, 0],
  ]
  for (const [w, h, d, x, py, z] of specs) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    mesh.position.set(x, py, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    table.add(mesh)
  }
}

function addCourtLines(table, lineMat, y) {
  const t = 0.014
  const lines = [
    [TABLE_W - 0.04, t, 0.02, 0, y, 0],
    [t, TABLE_L - 0.04, 0.02, -TABLE_W / 2 + 0.025, y, 0],
    [t, TABLE_L - 0.04, 0.02, TABLE_W / 2 - 0.025, y, 0],
    [t, TABLE_L / 2 - 0.06, 0.02, 0, y, TABLE_L / 4],
    [t, TABLE_L / 2 - 0.06, 0.02, 0, y, -TABLE_L / 4],
  ]
  for (const [w, h, d, x, py, z] of lines) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lineMat)
    mesh.position.set(x, py, z)
    table.add(mesh)
  }
}

export function createTableScene(canvas) {
  const scene = new THREE.Scene()
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40)
  camera.position.set(0, 1.72, 2.15)
  camera.lookAt(0, -0.05, -0.42)

  const table = new THREE.Group()
  table.position.set(0, -0.22, -0.55)

  const surfaceMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1b8a6a'),
    roughness: 0.26,
    metalness: 0.04,
    clearcoat: 0.88,
    clearcoatRoughness: 0.15,
  })
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#7a4f28',
    roughness: 0.78,
    metalness: 0.05,
  })
  const lineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' })

  const top = new THREE.Mesh(new THREE.BoxGeometry(TABLE_W, TOP_H, TABLE_L), surfaceMat)
  top.castShadow = true
  top.receiveShadow = true
  table.add(top)
  addApron(table, woodMat)

  const lineY = TOP_H / 2 + 0.008
  addCourtLines(table, lineMat, lineY)

  const shine = new THREE.Mesh(
    new THREE.PlaneGeometry(TABLE_W * 0.28, TABLE_L * 0.55),
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    }),
  )
  shine.rotation.x = -Math.PI / 2
  shine.position.y = lineY + 0.004
  table.add(shine)

  const netH = 0.15
  const postGeo = new THREE.CylinderGeometry(0.018, 0.018, netH, 10)
  const postMat = new THREE.MeshStandardMaterial({ color: '#cccccc', metalness: 0.6, roughness: 0.3 })
  for (const x of [-TABLE_W / 2 + 0.04, TABLE_W / 2 - 0.04]) {
    const post = new THREE.Mesh(postGeo, postMat)
    post.position.set(x, TOP_H / 2 + netH / 2, 0)
    table.add(post)
  }
  const net = new THREE.Mesh(
    new THREE.PlaneGeometry(TABLE_W - 0.06, netH),
    new THREE.MeshStandardMaterial({
      color: '#f8f8f8',
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      roughness: 0.95,
    }),
  )
  net.position.set(0, TOP_H / 2 + netH / 2, 0)
  table.add(net)

  scene.add(table)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ color: '#040608', roughness: 1 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.28
  floor.receiveShadow = true
  scene.add(floor)

  const key = new THREE.SpotLight(0xfff2dc, 22, 16, 0.5, 0.45, 1.2)
  key.position.set(0, 3.8, 2.2)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  scene.add(key)
  const keyTarget = new THREE.Object3D()
  keyTarget.position.set(0, -0.1, -0.55)
  scene.add(keyTarget)
  key.target = keyTarget

  scene.add(new THREE.AmbientLight(0x3a4a5a, 0.5))
  const fill = new THREE.DirectionalLight(0x99bbee, 0.35)
  fill.position.set(-2.5, 2, 2.5)
  scene.add(fill)

  const resize = (w, h, dpr) => {
    if (!w || !h) return
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  const render = (time) => {
    const pulse = Math.sin(time * 0.0013)
    key.intensity = 20 + pulse * 3
    shine.position.z = pulse * 0.12
    shine.material.opacity = 0.08 + (pulse + 1) * 0.025
    renderer.render(scene, camera)
  }

  const dispose = () => {
    renderer.dispose()
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => m.dispose())
      }
    })
  }

  return { resize, render, dispose }
}
