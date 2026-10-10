import type { Point2D } from '../types/geometry'
import { distance } from './point'
import { DISTANCE_EPSILON } from './tolerance'

export type Orientation = -1 | 0 | 1

export type SegmentIntersection =
  | 'none'
  /** Interiors cross at a single point. */
  | 'cross'
  /** Meet at a single point that is an endpoint of at least one segment. */
  | 'touch'
  /** Collinear and share a sub-segment of positive length. */
  | 'overlap'

function cross(o: Point2D, a: Point2D, b: Point2D): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

/**
 * Which side of the directed line a→b the point c lies on.
 * Returns 0 when c is within DISTANCE_EPSILON of the line, which keeps the
 * test independent of coordinate magnitude (|cross| = |ab| * distance).
 */
export function orientation(a: Point2D, b: Point2D, c: Point2D): Orientation {
  const value = cross(a, b, c)
  if (Math.abs(value) <= DISTANCE_EPSILON * distance(a, b)) {
    return 0
  }
  return value > 0 ? 1 : -1
}

/** Assumes p is collinear with a–b; checks it lies within the segment's extent. */
function isWithinSegmentBounds(p: Point2D, a: Point2D, b: Point2D): boolean {
  return (
    p.x >= Math.min(a.x, b.x) - DISTANCE_EPSILON &&
    p.x <= Math.max(a.x, b.x) + DISTANCE_EPSILON &&
    p.y >= Math.min(a.y, b.y) - DISTANCE_EPSILON &&
    p.y <= Math.max(a.y, b.y) + DISTANCE_EPSILON
  )
}

function classifyCollinear(p1: Point2D, p2: Point2D, q1: Point2D, q2: Point2D): SegmentIntersection {
  const [origin, end] = distance(p1, p2) >= distance(q1, q2) ? [p1, p2] : [q1, q2]
  const length = distance(origin, end)
  if (length <= DISTANCE_EPSILON) {
    return distance(p1, q1) <= DISTANCE_EPSILON ? 'touch' : 'none'
  }
  const dx = (end.x - origin.x) / length
  const dy = (end.y - origin.y) / length
  const project = (p: Point2D): number => (p.x - origin.x) * dx + (p.y - origin.y) * dy

  const [pa, pb] = [project(p1), project(p2)]
  const [qa, qb] = [project(q1), project(q2)]
  const overlap = Math.min(Math.max(pa, pb), Math.max(qa, qb)) - Math.max(Math.min(pa, pb), Math.min(qa, qb))

  if (overlap > DISTANCE_EPSILON) return 'overlap'
  if (overlap >= -DISTANCE_EPSILON) return 'touch'
  return 'none'
}

/** Classifies how segments p1–p2 and q1–q2 intersect, including collinear and endpoint cases. */
export function classifySegmentIntersection(
  p1: Point2D,
  p2: Point2D,
  q1: Point2D,
  q2: Point2D,
): SegmentIntersection {
  const o1 = orientation(p1, p2, q1)
  const o2 = orientation(p1, p2, q2)
  const o3 = orientation(q1, q2, p1)
  const o4 = orientation(q1, q2, p2)

  if (o1 === 0 && o2 === 0 && o3 === 0 && o4 === 0) {
    return classifyCollinear(p1, p2, q1, q2)
  }
  if (o1 * o2 < 0 && o3 * o4 < 0) {
    return 'cross'
  }
  if (
    (o1 === 0 && isWithinSegmentBounds(q1, p1, p2)) ||
    (o2 === 0 && isWithinSegmentBounds(q2, p1, p2)) ||
    (o3 === 0 && isWithinSegmentBounds(p1, q1, q2)) ||
    (o4 === 0 && isWithinSegmentBounds(p2, q1, q2))
  ) {
    return 'touch'
  }
  return 'none'
}
