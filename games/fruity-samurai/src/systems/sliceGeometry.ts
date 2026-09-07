import * as THREE from 'three'

const EPS = 1e-5
const A = new THREE.Vector3()
const B = new THREE.Vector3()
const C = new THREE.Vector3()
const AB = new THREE.Vector3()
const AC = new THREE.Vector3()
const N = new THREE.Vector3()
const P0 = new THREE.Vector3()
const P1 = new THREE.Vector3()
const P2 = new THREE.Vector3()
const NA = new THREE.Vector3()
const NB = new THREE.Vector3()
const NC = new THREE.Vector3()
const N0 = new THREE.Vector3()
const N1 = new THREE.Vector3()
const N2 = new THREE.Vector3()

function pushTri(
  positions: number[],
  normals: number[],
  uvs: number[] | null,
  pa: THREE.Vector3,
  pb: THREE.Vector3,
  pc: THREE.Vector3,
  na: THREE.Vector3,
  nb: THREE.Vector3,
  nc: THREE.Vector3,
  uva: { u: number; v: number },
  uvb: { u: number; v: number },
  uvc: { u: number; v: number },
): void {
  positions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z, pc.x, pc.y, pc.z)
  normals.push(na.x, na.y, na.z, nb.x, nb.y, nb.z, nc.x, nc.y, nc.z)
  uvs?.push(uva.u, uva.v, uvb.u, uvb.v, uvc.u, uvc.v)
}

function lerpAttr(
  out: THREE.Vector3,
  from: THREE.Vector3,
  to: THREE.Vector3,
  d0: number,
  d1: number,
): number {
  const t = d0 / (d0 - d1)
  out.lerpVectors(from, to, t)
  return t
}

/**
 * Keep the side of `geometry` where plane.distanceToPoint >= 0.
 * Returns a new non-indexed geometry, or null if nothing remains.
 */
export function clipGeometry(geometry: THREE.BufferGeometry, plane: THREE.Plane): THREE.BufferGeometry | null {
  const src = geometry.index ? geometry.toNonIndexed() : geometry
  const pos = src.getAttribute('position')
  if (!pos) return null
  const nor = src.getAttribute('normal')
  const uv = src.getAttribute('uv')
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] | null = uv ? [] : null

  const uvA = { u: 0, v: 0 }
  const uvB = { u: 0, v: 0 }
  const uvC = { u: 0, v: 0 }
  const uv0 = { u: 0, v: 0 }
  const uv1 = { u: 0, v: 0 }

  for (let i = 0; i < pos.count; i += 3) {
    A.fromBufferAttribute(pos, i)
    B.fromBufferAttribute(pos, i + 1)
    C.fromBufferAttribute(pos, i + 2)
    const da = plane.distanceToPoint(A)
    const db = plane.distanceToPoint(B)
    const dc = plane.distanceToPoint(C)
    const ka = da >= -EPS
    const kb = db >= -EPS
    const kc = dc >= -EPS
    const keepCount = (ka ? 1 : 0) + (kb ? 1 : 0) + (kc ? 1 : 0)
    if (keepCount === 0) continue

    if (nor) {
      NA.fromBufferAttribute(nor, i)
      NB.fromBufferAttribute(nor, i + 1)
      NC.fromBufferAttribute(nor, i + 2)
    } else {
      AB.subVectors(B, A)
      AC.subVectors(C, A)
      N.crossVectors(AB, AC).normalize()
      NA.copy(N)
      NB.copy(N)
      NC.copy(N)
    }
    if (uv) {
      uvA.u = uv.getX(i)
      uvA.v = uv.getY(i)
      uvB.u = uv.getX(i + 1)
      uvB.v = uv.getY(i + 1)
      uvC.u = uv.getX(i + 2)
      uvC.v = uv.getY(i + 2)
    }

    if (keepCount === 3) {
      pushTri(positions, normals, uvs, A, B, C, NA, NB, NC, uvA, uvB, uvC)
      continue
    }

    const pts = [A, B, C]
    const nrs = [NA, NB, NC]
    const uvs3 = [uvA, uvB, uvC]
    const dist = [da, db, dc]
    const keep = [ka, kb, kc]
    const inside: number[] = []
    const outside: number[] = []
    for (let k = 0; k < 3; k += 1) (keep[k] ? inside : outside).push(k)

    if (keepCount === 1) {
      const i0 = inside[0]
      const o0 = outside[0]
      const o1 = outside[1]
      const t0 = lerpAttr(P0, pts[i0], pts[o0], dist[i0], dist[o0])
      const t1 = lerpAttr(P1, pts[i0], pts[o1], dist[i0], dist[o1])
      N0.lerpVectors(nrs[i0], nrs[o0], t0).normalize()
      N1.lerpVectors(nrs[i0], nrs[o1], t1).normalize()
      if (uv) {
        uv0.u = uvs3[i0].u + (uvs3[o0].u - uvs3[i0].u) * t0
        uv0.v = uvs3[i0].v + (uvs3[o0].v - uvs3[i0].v) * t0
        uv1.u = uvs3[i0].u + (uvs3[o1].u - uvs3[i0].u) * t1
        uv1.v = uvs3[i0].v + (uvs3[o1].v - uvs3[i0].v) * t1
      }
      pushTri(positions, normals, uvs, pts[i0], P0, P1, nrs[i0], N0, N1, uvs3[i0], uv0, uv1)
    } else {
      const i0 = inside[0]
      const i1 = inside[1]
      const o0 = outside[0]
      const t0 = lerpAttr(P0, pts[i0], pts[o0], dist[i0], dist[o0])
      const t1 = lerpAttr(P1, pts[i1], pts[o0], dist[i1], dist[o0])
      N0.lerpVectors(nrs[i0], nrs[o0], t0).normalize()
      N1.lerpVectors(nrs[i1], nrs[o0], t1).normalize()
      if (uv) {
        uv0.u = uvs3[i0].u + (uvs3[o0].u - uvs3[i0].u) * t0
        uv0.v = uvs3[i0].v + (uvs3[o0].v - uvs3[i0].v) * t0
        uv1.u = uvs3[i1].u + (uvs3[o0].u - uvs3[i1].u) * t1
        uv1.v = uvs3[i1].v + (uvs3[o0].v - uvs3[i1].v) * t1
      }
      pushTri(positions, normals, uvs, pts[i0], pts[i1], P1, nrs[i0], nrs[i1], N1, uvs3[i0], uvs3[i1], uv1)
      pushTri(positions, normals, uvs, pts[i0], P1, P0, nrs[i0], N1, N0, uvs3[i0], uv1, uv0)
    }
  }

  if (positions.length < 9) return null
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  if (uvs) out.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  return out
}

export function worldPlaneToLocal(mesh: THREE.Object3D, worldPlane: THREE.Plane): THREE.Plane {
  mesh.updateWorldMatrix(true, false)
  const inv = mesh.matrixWorld.clone().invert()
  return worldPlane.clone().applyMatrix4(inv)
}
