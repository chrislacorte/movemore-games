import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { assetPath } from '../core/assetPath'
import { makeFleshTexture, type FleshSpec } from './fleshTexture'

export type FruitKind =
  | 'watermelon'
  | 'banana'
  | 'green-apple'
  | 'red-apple'
  | 'lemon'
  | 'lime'
  | 'mango'
  | 'orange'
  | 'passionfruit'
  | 'peach'
  | 'pear'
  | 'pineapple'
  | 'plum'
  | 'strawberry'
  | 'bomb'

export interface FruitDef {
  file: string
  label: string
  /** juice / splash colour */
  juice: string
  flesh: FleshSpec
  /** relative size multiplier */
  size: number
  /** spawn weight */
  weight: number
}

export const FRUITS: Record<FruitKind, FruitDef> = {
  watermelon: {
    file: 'watermelon.glb',
    label: 'Watermelon',
    juice: '#e8324a',
    flesh: { base: '#ff4a63', light: '#ff7a8c', rim: '#f2f7e0', seed: '#1a0c08', pattern: 'seeds' },
    size: 1.28,
    weight: 1.1,
  },
  banana: {
    file: 'banana.glb',
    label: 'Banana',
    juice: '#f5e27a',
    flesh: { base: '#fff0b8', light: '#fff8dc', rim: '#f7d94c', pattern: 'plain' },
    size: 1.15,
    weight: 0.9,
  },
  'green-apple': {
    file: 'green-apple.glb',
    label: 'Green Apple',
    juice: '#a8dc4a',
    flesh: { base: '#f4f6d8', light: '#fbfceb', rim: '#8cc63e', pattern: 'core' },
    size: 0.98,
    weight: 1,
  },
  'red-apple': {
    file: 'red-apple.glb',
    label: 'Apple',
    juice: '#e23a3a',
    flesh: { base: '#f7f0d6', light: '#fdf9ea', rim: '#d0302f', pattern: 'core' },
    size: 0.98,
    weight: 1,
  },
  lemon: {
    file: 'lemon.glb',
    label: 'Lemon',
    juice: '#f7d83a',
    flesh: { base: '#fbe98a', light: '#fff6c8', rim: '#f5d233', pattern: 'segments' },
    size: 0.86,
    weight: 1,
  },
  lime: {
    file: 'lime.glb',
    label: 'Lime',
    juice: '#8fd63b',
    flesh: { base: '#c8ec86', light: '#e8f7c0', rim: '#66b52c', pattern: 'segments' },
    size: 0.82,
    weight: 0.9,
  },
  mango: {
    file: 'mango.glb',
    label: 'Mango',
    juice: '#f7a327',
    flesh: { base: '#ffc648', light: '#ffdf8a', rim: '#f39b2c', pattern: 'stone' },
    size: 1.05,
    weight: 0.9,
  },
  orange: {
    file: 'orange.glb',
    label: 'Orange',
    juice: '#ff8a1f',
    flesh: { base: '#ffb050', light: '#ffd28a', rim: '#ff8c1a', pattern: 'segments' },
    size: 0.95,
    weight: 1.1,
  },
  passionfruit: {
    file: 'passionfruit.glb',
    label: 'Passion Fruit',
    juice: '#f3b83a',
    flesh: { base: '#ffcc55', light: '#ffe08a', rim: '#7a2f5c', seed: '#1a0a12', pattern: 'passion' },
    size: 0.85,
    weight: 0.7,
  },
  peach: {
    file: 'peach.glb',
    label: 'Peach',
    juice: '#f78c5a',
    flesh: { base: '#ffd9a8', light: '#ffeacc', rim: '#f0764f', pattern: 'stone' },
    size: 0.98,
    weight: 0.9,
  },
  pear: {
    file: 'pear.glb',
    label: 'Pear',
    juice: '#c9d75a',
    flesh: { base: '#f7f5d8', light: '#fdfcf0', rim: '#b8c84a', pattern: 'core' },
    size: 1.02,
    weight: 0.9,
  },
  pineapple: {
    file: 'pineapple.glb',
    label: 'Pineapple',
    juice: '#f5c542',
    flesh: { base: '#ffe27a', light: '#fff0b0', rim: '#a86a1e', pattern: 'rings' },
    size: 1.3,
    weight: 0.7,
  },
  plum: {
    file: 'plum.glb',
    label: 'Plum',
    juice: '#7a3b9c',
    flesh: { base: '#e8b34a', light: '#f6d27c', rim: '#5a1f6b', pattern: 'stone' },
    size: 0.82,
    weight: 0.8,
  },
  strawberry: {
    file: 'strawberry.glb',
    label: 'Strawberry',
    juice: '#e8304a',
    flesh: { base: '#ff6f7f', light: '#ffb3bb', rim: '#e0203c', pattern: 'strawberry' },
    size: 0.85,
    weight: 1,
  },
  bomb: {
    file: 'bomb.glb',
    label: 'Bomb',
    juice: '#ffb347',
    flesh: { base: '#222', light: '#444', rim: '#111', pattern: 'bomb' },
    size: 1.0,
    weight: 0,
  },
}

export const FRUIT_KINDS = (Object.keys(FRUITS) as FruitKind[]).filter((k) => k !== 'bomb')

export interface FruitTemplate {
  kind: FruitKind
  def: FruitDef
  /** unit-normalised (radius ≈ 1), indexed geometry in the mesh's local frame */
  geometry: THREE.BufferGeometry
  /** non-indexed copy used for slicing */
  sliceGeometry: THREE.BufferGeometry
  material: THREE.Material
  fleshMaterial: THREE.MeshStandardMaterial
  /** bounding-sphere radius after normalisation (≈1) */
  radius: number
  juice: THREE.Color
}

export function pickFruitKind(): FruitKind {
  let total = 0
  for (const k of FRUIT_KINDS) total += FRUITS[k].weight
  let r = Math.random() * total
  for (const k of FRUIT_KINDS) {
    r -= FRUITS[k].weight
    if (r <= 0) return k
  }
  return 'watermelon'
}

function normaliseGeometry(root: THREE.Object3D): { geometry: THREE.BufferGeometry; material: THREE.Material } {
  root.updateMatrixWorld(true)
  let mesh: THREE.Mesh | null = null
  root.traverse((o) => {
    if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh
  })
  if (!mesh) throw new Error('GLB has no mesh')
  const m = mesh as THREE.Mesh
  const geometry = m.geometry.clone()
  geometry.applyMatrix4(m.matrixWorld)
  geometry.computeBoundingBox()
  const box = geometry.boundingBox as THREE.Box3
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 1e-4)
  geometry.translate(-center.x, -center.y, -center.z)
  geometry.scale(2 / maxDim, 2 / maxDim, 2 / maxDim)
  geometry.computeBoundingSphere()
  geometry.computeBoundingBox()
  const material = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material
  return { geometry, material }
}

function tuneMaterial(mat: THREE.Material, kind: FruitKind): void {
  const std = mat as THREE.MeshStandardMaterial
  std.side = THREE.FrontSide
  if ('envMapIntensity' in std) std.envMapIntensity = kind === 'bomb' ? 1.6 : 1.1
  if ('roughness' in std && typeof std.roughness === 'number') {
    std.roughness = Math.min(std.roughness, kind === 'bomb' ? 0.35 : 0.6)
  }
  std.needsUpdate = true
}

export async function loadFruitKit(onProgress?: (done: number, total: number) => void): Promise<Map<FruitKind, FruitTemplate>> {
  const loader = new GLTFLoader()
  const draco = new DRACOLoader()
  draco.setDecoderPath(assetPath('draco/'))
  loader.setDRACOLoader(draco)

  const kinds = Object.keys(FRUITS) as FruitKind[]
  let done = 0
  const entries = await Promise.all(
    kinds.map(async (kind) => {
      const def = FRUITS[kind]
      const gltf = await loader.loadAsync(assetPath(`models/fruits/${def.file}`))
      const { geometry, material } = normaliseGeometry(gltf.scene)
      tuneMaterial(material, kind)
      const fleshMaterial = new THREE.MeshStandardMaterial({
        map: makeFleshTexture(def.flesh),
        roughness: kind === 'bomb' ? 0.5 : 0.35,
        metalness: 0,
        side: THREE.DoubleSide,
      })
      const template: FruitTemplate = {
        kind,
        def,
        geometry,
        sliceGeometry: geometry.index ? geometry.toNonIndexed() : geometry,
        material,
        fleshMaterial,
        radius: geometry.boundingSphere?.radius ?? 1,
        juice: new THREE.Color(def.juice),
      }
      done += 1
      onProgress?.(done, kinds.length)
      return [kind, template] as const
    }),
  )
  draco.dispose()
  return new Map(entries)
}
