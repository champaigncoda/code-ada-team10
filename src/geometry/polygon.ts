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

export function areEdgesAdjacent(i: number, j: number, vertexCount: number): boolean {
  const diff = Math.abs(i - j)
  return diff === 1 || diff === vertexCount - 1
}
