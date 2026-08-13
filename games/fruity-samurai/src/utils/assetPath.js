const BASE = import.meta.env.BASE_URL

export function assetPath(relativePath) {
  const clean = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return `${BASE}${clean}`
}
