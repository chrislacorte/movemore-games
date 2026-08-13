import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { project } from './pongRenderer'
import {
  PADDLE_W,
  PADDLE_H,
  PADDLE_MODEL_URL,
  PADDLE_MODEL_BASE_SIZE,
  PADDLE_MODEL_SCALE,
} from '../constants/gameConfig'

function applyMeshSettings(root) {
  root.traverse((child) => {
    if (!child.isMesh) return
    child.frustumCulled = false
    child.castShadow = true
    child.receiveShadow = true

    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material]

    child.material = mats.map((m) => {
      const mat = m.clone()
      mat.side = THREE.DoubleSide
      mat.depthWrite = true
      mat.transparent = false
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace
      if (mat.emissive) {
        mat.emissive.set(0x1a2838)
        mat.emissiveIntensity = 0.18
      }
      if ('roughness' in mat) mat.roughness = Math.min(0.92, (mat.roughness ?? 0.6) + 0.08)
      if ('metalness' in mat) mat.metalness = Math.max(0, (mat.metalness ?? 0.1) - 0.05)
      return mat
    })

    if (child.material.length === 1) {
      child.material = child.material[0]
    }
  })
}

function prepareModel(root) {
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.001)

  root.position.sub(center)
  root.rotation.set(0, 0, 0)
  applyMeshSettings(root)

  return PADDLE_MODEL_BASE_SIZE / maxDim
}

function placePaddle(mesh, normFactor, x, y, z, w, h, time, variant) {
  const { screenX, screenY, scale } = project(x, y, z, w, h)
  const pw = w * PADDLE_W * scale * PADDLE_MODEL_SCALE
  const ph = h * PADDLE_H * scale * PADDLE_MODEL_SCALE
  const targetPx = Math.max(pw, ph)
  const worldScale = normFactor * (targetPx / PADDLE_MODEL_BASE_SIZE)

  mesh.visible = true
  mesh.position.set(screenX, h - screenY, 0)
  mesh.scale.setScalar(worldScale)

  mesh.rotation.set(
    variant === 'player' ? 0.35 : 0.2,
    Math.PI,
    0,
  )

  if (variant === 'player') {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.008)
    mesh.position.z = pulse * 0.5
  } else {
    mesh.position.z = 0
  }
}

export function createPaddleScene(canvas) {
  const scene = new THREE.Scene()

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.autoClear = true

  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 200)
  camera.position.set(0, 0, 100)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xf0f4ff, 0.95))

  const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.1)
  keyLight.position.set(0.15, 0.55, 1.2)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0x88c4ff, 0.65)
  fillLight.position.set(-0.55, -0.15, 0.9)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xff8866, 0.45)
  rimLight.position.set(0.4, 0.1, -0.6)
  scene.add(rimLight)

  let playerMesh = null
  let aiMesh = null
  let normFactor = 1
  let loaded = false
  let loadError = null
  let pendingSize = null

  const loader = new GLTFLoader()
  loader.load(
    PADDLE_MODEL_URL,
    (gltf) => {
      normFactor = prepareModel(gltf.scene)

      playerMesh = gltf.scene.clone(true)
      applyMeshSettings(playerMesh)
      scene.add(playerMesh)

      aiMesh = gltf.scene.clone(true)
      applyMeshSettings(aiMesh)
      scene.add(aiMesh)

      loaded = true
      if (pendingSize) {
        resize(pendingSize.w, pendingSize.h, pendingSize.dpr)
        pendingSize = null
      }
    },
    undefined,
    (err) => {
      console.error('Paddle GLB load failed:', err)
      loadError = err
    },
  )

  const resize = (w, h, dpr) => {
    if (!w || !h) return
    if (!loaded) {
      pendingSize = { w, h, dpr }
      return
    }
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)
    camera.left = 0
    camera.right = w
    camera.top = h
    camera.bottom = 0
    camera.updateProjectionMatrix()
  }

  const render = ({ playerPaddle, aiPaddle, w, h, time }) => {
    if (!loaded || !playerMesh || !aiMesh || !w || !h) return

    if (playerPaddle) {
      placePaddle(
        playerMesh,
        normFactor,
        playerPaddle.x,
        playerPaddle.y,
        0.94,
        w,
        h,
        time,
        'player',
      )
    } else {
      playerMesh.visible = false
    }

    if (aiPaddle) {
      placePaddle(
        aiMesh,
        normFactor,
        aiPaddle.x,
        aiPaddle.y,
        0.08,
        w,
        h,
        time,
        'ai',
      )
    } else {
      aiMesh.visible = false
    }

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

  return {
    resize,
    render,
    dispose,
    isLoaded: () => loaded,
    getError: () => loadError,
  }
}
