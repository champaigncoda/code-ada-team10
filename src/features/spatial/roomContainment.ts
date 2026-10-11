import { perimeter, signedArea } from '../../geometry/polygon'
import { validatePolygon } from '../../geometry/polygonValidation'
import type { Point2D } from '../../types/geometry'
import { isPointInFloorPolygon } from '../furniture/placement/floorPlacement'
import type { PointXZ } from './footprint'

/**
 * Floating-point slack for room-boundary tests, in meters.
 * 0.1 mm absorbs coordinate noise. It is not a physical clearance.
 * A footprint vertex or edge sample within this distance of a room edge
 * counts as on the boundary and is allowed. This value is independent of
 * the 5 mm furniture-contact tolerance.
 */
export const BOUNDARY_EPSILON = 0.0001

export type RoomBoundaryStatus = 'available' | 'unavailable'

/**
 * `inside` — the whole footprint is in the room or on its boundary.
 * `outside` — a positive-area portion leaves the room.
 * `unavailable` — the room polygon (or the footprint) cannot be tested.
 * Unavailable is not a successful containment result.
 */
export type FurnitureContainment = 'inside' | 'outside' | 'unavailable'

function isFinitePoint(point: PointXZ | undefined): point is PointXZ {
  return point !== undefined && Number.isFinite(point.x) && Number.isFinite(point.z)
}

function asPlanar(point: PointXZ): Point2D {
  return { x: point.x, y: point.z }
}

function distance(a: PointXZ, b: PointXZ): number {
  return Math.hypot(b.x - a.x, b.z - a.z)
}

/** Fewer than three corners separated by more than the boundary tolerance. */
function hasThreeDistinctVertices(polygon: readonly PointXZ[]): boolean {
  const distinct: PointXZ[] = []
  for (const vertex of polygon) {
    if (!distinct.some((other) => distance(other, vertex) <= BOUNDARY_EPSILON)) {
      distinct.push(vertex)
    }
    if (distinct.length >= 3) return true
  }
  return false
}

/**
 * A room polygon can be used for containment when it has at least three
 * separated, finite corners, encloses more than a sliver, and does not cross
 * itself. Anything else makes boundary validation unavailable.
 */
export function assessRoomPolygon(polygon: readonly PointXZ[]): RoomBoundaryStatus {
  if (polygon.length < 3 || !polygon.every((vertex) => isFinitePoint(vertex))) return 'unavailable'
  if (!hasThreeDistinctVertices(polygon)) return 'unavailable'

  const planar = polygon.map(asPlanar)
  const area = Math.abs(signedArea(planar))
  const outline = perimeter(planar)
  // A sliver thinner than about 0.2 mm has area ≤ epsilon × perimeter.
  if (!(area > BOUNDARY_EPSILON * outline)) return 'unavailable'
  if (!validatePolygon(planar).isValid) return 'unavailable'
  return 'available'
}

function parameterOnSegment(start: PointXZ, end: PointXZ, point: PointXZ, length: number): number | null {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const lengthSquared = length * length
  if (lengthSquared === 0) return null
  const t = ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared
  const distanceToLine = Math.hypot(point.x - (start.x + t * dx), point.z - (start.z + t * dz))
  if (distanceToLine > BOUNDARY_EPSILON) return null
  const tolerance = BOUNDARY_EPSILON / length
  if (t < -tolerance || t > 1 + tolerance) return null
  return Math.min(1, Math.max(0, t))
}

/**
 * Parameters along start→end where the segment meets a room edge, including
 * collinear overlaps and crossings that only touch a room vertex.
 */
function addEdgeParameters(start: PointXZ, end: PointXZ, edgeStart: PointXZ, edgeEnd: PointXZ, length: number, parameters: number[]) {
  const abx = end.x - start.x
  const abz = end.z - start.z
  const cdx = edgeEnd.x - edgeStart.x
  const cdz = edgeEnd.z - edgeStart.z
  const edgeLength = Math.hypot(cdx, cdz)
  if (edgeLength === 0) {
    const t = parameterOnSegment(start, end, edgeStart, length)
    if (t !== null) parameters.push(t)
    return
  }

  const distanceToLine = (point: PointXZ) => Math.abs((point.x - start.x) * abz - (point.z - start.z) * abx) / length
  if (distanceToLine(edgeStart) <= BOUNDARY_EPSILON && distanceToLine(edgeEnd) <= BOUNDARY_EPSILON) {
    const project = (point: PointXZ) => ((point.x - start.x) * abx + (point.z - start.z) * abz) / (length * length)
    const lo = Math.max(0, Math.min(project(edgeStart), project(edgeEnd)))
    const hi = Math.min(1, Math.max(project(edgeStart), project(edgeEnd)))
    if (hi - lo >= -BOUNDARY_EPSILON / length) {
      parameters.push(lo, hi)
    }
    return
  }

  const denom = abx * cdz - abz * cdx
  // Parallel edges that are not collinear do not cross. Vertex contact is
  // recorded separately so a concave corner is not missed.
  if (Math.abs(denom) <= BOUNDARY_EPSILON * edgeLength) return

  const acx = edgeStart.x - start.x
  const acz = edgeStart.z - start.z
  const t = (acx * cdz - acz * cdx) / denom
  const u = (acx * abz - acz * abx) / denom
  const tTolerance = BOUNDARY_EPSILON / length
  const uTolerance = BOUNDARY_EPSILON / edgeLength
  if (t >= -tTolerance && t <= 1 + tTolerance && u >= -uTolerance && u <= 1 + uTolerance) {
    parameters.push(Math.min(1, Math.max(0, t)))
  }
}

function splitParameters(start: PointXZ, end: PointXZ, room: readonly PointXZ[]): number[] {
  const length = distance(start, end)
  const parameters = [0, 1]
  if (length <= BOUNDARY_EPSILON) return parameters

  for (let index = 0; index < room.length; index += 1) {
    const edgeStart = room[index]
    const edgeEnd = room[(index + 1) % room.length]
    if (!edgeStart || !edgeEnd) continue
    addEdgeParameters(start, end, edgeStart, edgeEnd, length, parameters)
  }
  for (const vertex of room) {
    const t = parameterOnSegment(start, end, vertex, length)
    if (t !== null) parameters.push(t)
  }

  parameters.sort((left, right) => left - right)
  const spacing = BOUNDARY_EPSILON / length
  const unique: number[] = []
  for (const t of parameters) {
    const last = unique[unique.length - 1]
    if (last === undefined || t - last > spacing) unique.push(t)
  }
  return unique
}

function pointAt(start: PointXZ, end: PointXZ, t: number): PointXZ {
  return {
    x: start.x + (end.x - start.x) * t,
    z: start.z + (end.z - start.z) * t,
  }
}

/**
 * Both endpoints are already known to be inside or on the boundary.
 * The edge is split at every room-edge intersection and every room vertex
 * it passes through, then each piece is sampled. Checking only proper
 * crossings would miss a segment that leaves through a concave vertex and
 * whose midpoint lands back on that vertex.
 */
function segmentStaysInside(start: PointXZ, end: PointXZ, room: readonly PointXZ[]): boolean {
  const length = distance(start, end)
  if (length <= BOUNDARY_EPSILON) return isPointInFloorPolygon(start, room, BOUNDARY_EPSILON)

  const splits = splitParameters(start, end, room)
  for (let index = 0; index < splits.length - 1; index += 1) {
    const t0 = splits[index]
    const t1 = splits[index + 1]
    if (t0 === undefined || t1 === undefined) return false
    if ((t1 - t0) * length <= BOUNDARY_EPSILON) continue
    for (const fraction of [0.25, 0.5, 0.75]) {
      const sample = pointAt(start, end, t0 + (t1 - t0) * fraction)
      if (!isPointInFloorPolygon(sample, room, BOUNDARY_EPSILON)) return false
    }
  }
  return true
}

function footprintIsTestable(footprint: readonly PointXZ[]): boolean {
  if (footprint.length < 3 || !footprint.every((vertex) => isFinitePoint(vertex))) return false
  const planar = footprint.map(asPlanar)
  return Math.abs(signedArea(planar)) > BOUNDARY_EPSILON * perimeter(planar)
}

/**
 * True only when the entire footprint lies inside the room or on its boundary.
 * A false result means "not confirmed inside"; call `assessRoomPolygon` to
 * tell an invalid room apart from a footprint that actually sticks out.
 */
export function isFurnitureWithinRoom(footprint: readonly PointXZ[], roomPolygon: readonly PointXZ[]): boolean {
  return classifyFurnitureContainment(footprint, roomPolygon) === 'inside'
}

export function classifyFurnitureContainment(
  footprint: readonly PointXZ[],
  roomPolygon: readonly PointXZ[],
): FurnitureContainment {
  if (assessRoomPolygon(roomPolygon) !== 'available') return 'unavailable'
  if (!footprintIsTestable(footprint)) return 'unavailable'

  for (const vertex of footprint) {
    if (!isPointInFloorPolygon(vertex, roomPolygon, BOUNDARY_EPSILON)) return 'outside'
  }
  for (let index = 0; index < footprint.length; index += 1) {
    const start = footprint[index]
    const end = footprint[(index + 1) % footprint.length]
    if (!start || !end) return 'unavailable'
    if (!segmentStaysInside(start, end, roomPolygon)) return 'outside'
  }
  return 'inside'
}
