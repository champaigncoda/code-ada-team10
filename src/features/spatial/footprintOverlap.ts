import type { PointXZ } from './footprint'

/**
 * Contact slack for footprint overlap, in meters.
 * Rectangles whose projection overlap is 5 mm or less on any normalized
 * separating axis count as touching, not overlapping. This is intentional
 * clearance for flush placement and float noise. Do not reuse it for room
 * boundaries — those use `BOUNDARY_EPSILON` (0.1 mm).
 */
export const OVERLAP_EPSILON = 0.005

interface Interval {
  readonly min: number
  readonly max: number
}

function isFinitePoint(point: PointXZ | undefined): point is PointXZ {
  return point !== undefined && Number.isFinite(point.x) && Number.isFinite(point.z)
}

/** Unit normals of the first two edges. A rectangle's other two edges repeat them. */
function rectangleAxes(corners: readonly PointXZ[]): PointXZ[] | null {
  const axes: PointXZ[] = []
  for (let index = 0; index < 2; index += 1) {
    const start = corners[index]
    const end = corners[index + 1]
    if (!start || !end) return null
    const dx = end.x - start.x
    const dz = end.z - start.z
    const length = Math.hypot(dx, dz)
    if (!(length > 0) || !Number.isFinite(length)) return null
    axes.push({ x: -dz / length, z: dx / length })
  }
  return axes
}

function project(corners: readonly PointXZ[], axis: PointXZ): Interval {
  let min = Infinity
  let max = -Infinity
  for (const corner of corners) {
    const distance = corner.x * axis.x + corner.z * axis.z
    min = Math.min(min, distance)
    max = Math.max(max, distance)
  }
  return { min, max }
}

/** Meters of overlap along one axis. Negative when the intervals are separated. */
export function projectionOverlapDepth(a: Interval, b: Interval): number {
  return Math.min(a.max, b.max) - Math.max(a.min, b.min)
}

function bounds(corners: readonly PointXZ[]): { minX: number; maxX: number; minZ: number; maxZ: number } {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const corner of corners) {
    minX = Math.min(minX, corner.x)
    maxX = Math.max(maxX, corner.x)
    minZ = Math.min(minZ, corner.z)
    maxZ = Math.max(maxZ, corner.z)
  }
  return { minX, maxX, minZ, maxZ }
}

/**
 * Axis-aligned bounds can reject pairs that are clearly apart. They must not
 * decide that rotated rectangles overlap: a following SAT test still runs
 * whenever the boxes come within the contact tolerance.
 */
function separatedByBounds(a: readonly PointXZ[], b: readonly PointXZ[]): boolean {
  const boxA = bounds(a)
  const boxB = bounds(b)
  const overlapX = projectionOverlapDepth(
    { min: boxA.minX, max: boxA.maxX },
    { min: boxB.minX, max: boxB.maxX },
  )
  const overlapZ = projectionOverlapDepth(
    { min: boxA.minZ, max: boxA.maxZ },
    { min: boxB.minZ, max: boxB.maxZ },
  )
  return overlapX <= OVERLAP_EPSILON || overlapZ <= OVERLAP_EPSILON
}

function isRectangle(corners: readonly PointXZ[]): boolean {
  return corners.length === 4 && corners.every((corner) => isFinitePoint(corner))
}

/**
 * Separating Axis Theorem on two rectangles in the XZ plane.
 * Overlap is reported only when every unit axis overlaps by more than
 * `OVERLAP_EPSILON` meters. Edge contact, corner contact, and a contained
 * sliver no thicker than that tolerance are not overlaps.
 * Returns false for malformed corners. Callers must not treat that false
 * result as a validated clearance — skip invalid footprints before calling.
 */
export function doFurnitureFootprintsOverlap(footprintA: readonly PointXZ[], footprintB: readonly PointXZ[]): boolean {
  if (!isRectangle(footprintA) || !isRectangle(footprintB)) return false
  if (separatedByBounds(footprintA, footprintB)) return false

  const axesA = rectangleAxes(footprintA)
  const axesB = rectangleAxes(footprintB)
  if (!axesA || !axesB) return false

  for (const axis of [...axesA, ...axesB]) {
    const depth = projectionOverlapDepth(project(footprintA, axis), project(footprintB, axis))
    if (depth <= OVERLAP_EPSILON) return false
  }
  return true
}
