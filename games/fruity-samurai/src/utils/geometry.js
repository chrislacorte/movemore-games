function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const det = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx)
  if (det === 0) return false
  const lambda = ((dy - cy) * (dx - ax) + (cx - dx) * (dy - ay)) / det
  const gamma = ((ay - cy) * (bx - ax) + (ax - cx) * (by - ay)) / det
  return lambda >= 0 && lambda <= 1 && gamma >= 0 && gamma <= 1
}

/** @param {{ left: number, top: number, right: number, bottom: number }} rect */
export function lineIntersectsRect(x1, y1, x2, y2, rect) {
  if (!rect) return false

  if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true

  const { left, top, right, bottom } = rect
  const edges = [
    [left, top, right, top],
    [right, top, right, bottom],
    [right, bottom, left, bottom],
    [left, bottom, left, top],
  ]

  return edges.some(([cx, cy, dx, dy]) => segmentsIntersect(x1, y1, x2, y2, cx, cy, dx, dy))
}

/** DOMRect → canvas coords */
export function domRectToCanvas(rect, containerRect) {
  if (!rect || !containerRect) return null
  return {
    left: rect.left - containerRect.left,
    top: rect.top - containerRect.top,
    right: rect.right - containerRect.left,
    bottom: rect.bottom - containerRect.top,
    width: rect.width,
    height: rect.height,
  }
}
