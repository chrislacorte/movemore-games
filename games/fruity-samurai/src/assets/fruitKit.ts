import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { assetPath } from './assetPath'

export type FruitKind =
  | 'red-apple'
  | 'green-apple'
  | 'banana'
  | 'orange'
  | 'lemon'
  | 'lime'
  | 'strawberry'
  | 'pineapple'
  | 'watermelon'
  | 'pear'
  | 'peach'
  | 'mango'
  | 'plum'
  | 'passionfruit'
  | 'bomb'

export const FRUIT_KINDS: FruitKind[] = [
  'red-apple',
  'green-apple',
  'banana',
  'orange',
  'lemon',
  'lime',
  'strawberry',
  'pineapple',
  'watermelon',
  'pear',
  'peach',
  'mango',
  'plum',
  'passionfruit',
]

export const FRUIT_JUICE: Record<FruitKind, string> = {
  'red-apple': '#e23a3a',
  'green-apple': '#8fbf3a',
  banana: '#f4d35e',
  orange: '#ff8a1f',
  lemon: '#ffe44d',
  lime: '#9ad13a',
  strawberry: '#e4233a',
  pineapple: '#e6c04a',
  watermelon: '#ff4f6d',
  pear: '#c6d454',
  peach: '#ff8a5c',
  mango: '#ffb020',
  plum: '#8a3d7a',
  passionfruit: '#6b2d8a',
  bomb: '#ff4d2e',
}

const FRUIT_FILES: Record<FruitKind, string> = {
  'red-apple': 'apple-red.glb',
  'green-apple': 'apple-green.glb',
  banana: 'banana.glb',
  orange: 'orange.glb',
  lemon: 'lemon.glb',
  lime: 'lime.glb',
  strawberry: 'strawberry.glb',
  pineapple: 'pineapple.glb',
  watermelon: 'watermelon.glb',
  pear: 'pear.glb',
  peach: 'peach.glb',
  mango: 'mango.glb',
  plum: 'plum.glb',
  passionfruit: 'passionfruit.glb',
  bomb: 'bomb.glb',
}

const FLESH: Record<FruitKind, string> = {
  'red-apple': '#f0d48a',
  'green-apple': '#e8d98a',
  banana: '#f3e08a',
  orange: '#ff9a2e',
  lemon: '#fff04a',
  lime: '#c6e04a',
  strawberry: '#ff4d63',
  pineapple: '#f0c84a',
  watermelon: '#e23d58',
  pear: '#e6d56a',
  peach: '#ffb07a',
  mango: '#ffbe3a',
  plum: '#d478b4',
  passionfruit: '#e8c44a',
  bomb: '#2a1010',
}

const OUTLINE = new THREE.MeshBasicMaterial({
  color: '#120c09',
  side: THREE.BackSide,
  toneMapped: false,
})

export interface FruitTemplate {
  kind: FruitKind
  root: THREE.Object3D
  radius: number
  juice: string
  flesh: string
  isBomb: boolean
}

function shareClone(src: THREE.Object3D): THREE.Object3D {
  const dst = src.clone(false)
  if (src instanceof THREE.Mesh) {
    const mesh = dst as THREE.Mesh
    mesh.geometry = src.geometry
    mesh.material = src.material
  }
  for (const child of src.children) dst.add(shareClone(child))
  return dst
}

function prepareScene(scene: THREE.Object3D, targetRadius: number): { root: THREE.Object3D; radius: number } {
  scene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(scene)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  scene.position.sub(center)
  const maxDim = Math.max(size.x, size.y, size.z, 0.001)
  scene.scale.multiplyScalar((targetRadius * 2) / maxDim)
  scene.updateMatrixWorld(true)
  const scaled = new THREE.Box3().setFromObject(scene)
  const scaledSize = scaled.getSize(new THREE.Vector3())
  const radius = Math.max(scaledSize.x, scaledSize.y, scaledSize.z) * 0.48
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = false
      obj.receiveShadow = false
      obj.frustumCulled = true
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((mat) => {
        const std = mat as THREE.MeshStandardMaterial
        std.side = THREE.FrontSide
        if ('metalness' in std) std.metalness = Math.min(std.metalness ?? 0.04, 0.05)
        if ('roughness' in std) std.roughness = Math.min(Math.max(std.roughness ?? 0.45, 0.4), 0.7)
        if ('emissiveIntensity' in std) std.emissiveIntensity = Math.max(std.emissiveIntensity ?? 0, 0.12)
        if ('color' in std && std.color) std.color.multiplyScalar(1.08)
      })
    }
  })
  return { root: scene, radius }
}

export async function loadFruitKit(targetRadius: number): Promise<Map<FruitKind, FruitTemplate>> {
  const loader = new GLTFLoader()
  const draco = new DRACOLoader()
  draco.setDecoderPath(assetPath('draco/'))
  loader.setDRACOLoader(draco)

  const kinds: FruitKind[] = [...FRUIT_KINDS, 'bomb']
  const loaded = await Promise.all(
    kinds.map(async (kind) => {
      const gltf = await loader.loadAsync(assetPath(`models/fruits/${FRUIT_FILES[kind]}`))
      const { root, radius } = prepareScene(gltf.scene, kind === 'bomb' ? targetRadius * 0.92 : targetRadius)
      const template: FruitTemplate = {
        kind,
        root,
        radius,
        juice: FRUIT_JUICE[kind],
        flesh: FLESH[kind],
        isBomb: kind === 'bomb',
      }
      return [kind, template] as const
    }),
  )

  draco.dispose()
  return new Map(loaded)
}

export function cloneFruitView(template: FruitTemplate, withOutline = true): THREE.Object3D {
  const root = shareClone(template.root)
  if (!withOutline) return root
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || obj.userData.inkOutline) return
    const hull = new THREE.Mesh(obj.geometry, OUTLINE)
    hull.userData.inkOutline = true
    hull.scale.setScalar(1.055)
    hull.renderOrder = obj.renderOrder - 1
    hull.frustumCulled = true
    obj.add(hull)
  })
  return root
}
