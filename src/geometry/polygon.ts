import type { Point2D } from '../types/geometry'
import { distance } from './point'

/** Shoelace formula. Positive for counter-clockwise in a y-up system (clockwise on screen). */
export function signedArea(vertices: readonly Point2D[]): number {
  let sum = 0
  vertices.forEach((current, i) => {
    const next = vertices[(i + 1) % vertices.length] ?? current
    sum += current.x * next.y - next.x * current.y
  })
  return sum / 2
}

export function perimeter(vertices: readonly Point2D[]): number {
  return vertices.reduce((total, current, i) => {
    const next = vertices[(i + 1) % vertices.length] ?? current
    return total + distance(current, next)
  }, 0)
}

/** Edge i runs from vertex i to vertex i + 1, with the last edge closing back to vertex 0. */
export function getEdge(vertices: readonly Point2D[], index: number): readonly [Point2D, Point2D] {
  const start = vertices[index]
  const end = vertices[(index + 1) % vertices.length]
  if (!start || !end) {
    throw new RangeError(`Edge ${index} does not exist in a polygon with ${vertices.length} vertices`)
  }
  return [start, end]
}

/** Pixel length of every edge, in edge-index order, including the closing edge. */
export function edgeLengths(vertices: readonly Point2D[]): number[] {
  return vertices.map((_, i) => {
    const [start, end] = getEdge(vertices, i)
    return distance(start, end)
  })
}

export interface BoundingBox {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

export function boundingBox(vertices: readonly Point2D[]): BoundingBox {
  if (vertices.length === 0) {
    throw new RangeError('A bounding box needs at least one vertex')
  }
  return {
    minX: Math.min(...vertices.map((v) => v.x)),
    minY: Math.min(...vertices.map((v) => v.y)),
    maxX: Math.max(...vertices.map((v) => v.x)),
    maxY: Math.max(...vertices.map((v) => v.y)),
  }
}

export function boundingBoxCenter(vertices: readonly Point2D[]): Point2D {
  const box = boundingBox(vertices)
  return { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 }
}

/** Even-odd ray cast. Vertices on an edge are treated as inside. */
export function isPointInPolygon(point: Point2D, vertices: readonly Point2D[]): boolean {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const current = vertices[i]
    const previous = vertices[j]
    if (!current || !previous) continue
    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x
    if (intersects) inside = !inside
  }
  return inside
}

export function areEdgesAdjacent(i: number, j: number, vertexCount: number): boolean {
  const diff = Math.abs(i - j)
  return diff === 1 || diff === vertexCount - 1
}
