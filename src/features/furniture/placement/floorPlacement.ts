import { distanceToSegment } from '../../../geometry/segment'
import type { Point2D } from '../../../types/geometry'
import type { FloorPoint, Point3D } from '../../../types/room'

/**
 * A point this close to a floor edge or vertex, in meters, counts as on the
 * boundary and may be placed. 0.1 mm is enough for floating-point noise and
 * small enough that a point a centimetre outside the room is still rejected.
 */
export const PLACEMENT_EDGE_TOLERANCE_METERS = 1e-4

/** Ignore a ray that is nearly parallel to the floor. */
const PARALLEL_Y = 1e-8

/**
 * Intersect a world-space ray with the floor plane Y = 0.
 * The result is in meters and does not depend on viewport size. Returns null
 * when the ray is parallel to the floor or the plane lies behind the origin.
 */
export function rayHitFloorY0(origin: Point3D, direction: Point3D): FloorPoint | null {
  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y) || !Number.isFinite(origin.z)) return null
  if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y) || !Number.isFinite(direction.z)) return null
  if (Math.abs(direction.y) < PARALLEL_Y) return null
  const t = -origin.y / direction.y
  if (!(t >= 0) || !Number.isFinite(t)) return null
  const x = origin.x + direction.x * t
  const z = origin.z + direction.z * t
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null
  return { x, z }
}

function asPlanar(point: FloorPoint): Point2D {
  return { x: point.x, y: point.z }
}

function liesOnBoundary(point: FloorPoint, footprint: readonly FloorPoint[], tolerance: number): boolean {
  const planar = asPlanar(point)
  for (let index = 0; index < footprint.length; index += 1) {
    const start = footprint[index]
    const end = footprint[(index + 1) % footprint.length]
    if (!start || !end) return false
    if (distanceToSegment(planar, asPlanar(start), asPlanar(end)) <= tolerance) return true
  }
  return false
}

/**
 * Even-odd ray cast toward +X. Boundary points are classified separately so
 * this only runs for points that are not on an edge.
 */
function rayCastInside(point: FloorPoint, footprint: readonly FloorPoint[]): boolean {
  const x = point.x
  const z = point.z
  let inside = false
  for (let index = 0, previous = footprint.length - 1; index < footprint.length; previous = index, index += 1) {
    const current = footprint[index]
    const prior = footprint[previous]
    if (!current || !prior) return false
    const crossesZ = current.z > z !== prior.z > z
    if (!crossesZ) continue
    const edgeX = ((prior.x - current.x) * (z - current.z)) / (prior.z - current.z) + current.x
    if (x < edgeX) inside = !inside
  }
  return inside
}

/**
 * True when `point` is inside or on the boundary of the room footprint.
 * The footprint is the calibrated floor polygon in world XZ meters — the same
 * frame furniture is placed in — not the room's bounding rectangle.
 */
export function isPointInFloorPolygon(
  point: FloorPoint,
  footprint: readonly FloorPoint[],
  tolerance = PLACEMENT_EDGE_TOLERANCE_METERS,
): boolean {
  if (footprint.length < 3) return false
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return false
  if (liesOnBoundary(point, footprint, tolerance)) return true
  return rayCastInside(point, footprint)
}
