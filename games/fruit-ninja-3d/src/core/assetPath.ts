const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`

export function assetPath(relative: string): string {
  return `${BASE}${relative.replace(/^\/+/, '')}`
}
