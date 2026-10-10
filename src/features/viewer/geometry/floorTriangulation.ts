import { ShapeUtils, Vector2 } from 'three'
import type { FloorPoint } from '../../../types/room'

export type FloorTriangle = readonly [number, number, number]

/** y component of (b − a) × (c − a); positive when the triangle faces +y. */
export function triangleNormalY(a: FloorPoint, b: FloorPoint, c: FloorPoint): number {
  return (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z)
}

/**
 * Ear-clipping triangulation (Three.js ShapeUtils / earcut) of the exact
 * footprint, so concave and L-shaped rooms are filled without spilling past
 * their walls. Each triangle is re-wound to face up, which makes the result
 * independent of whether the outline was drawn clockwise or counter-clockwise.
 */
export function triangulateFootprint(footprint: readonly FloorPoint[]): FloorTriangle[] {
  if (footprint.length < 3) return []
  const contour = footprint.map((p) => new Vector2(p.x, p.z))
  const triangles: FloorTriangle[] = []
  for (const [a, b, c] of ShapeUtils.triangulateShape(contour, [])) {
    if (a === undefined || b === undefined || c === undefined) continue
    const pa = footprint[a]
    const pb = footprint[b]
    const pc = footprint[c]
    if (!pa || !pb || !pc) continue
    triangles.push(triangleNormalY(pa, pb, pc) < 0 ? [a, c, b] : [a, b, c])
  }
  return triangles
}
