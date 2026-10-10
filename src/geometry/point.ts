import type { Point2D } from '../types/geometry'
import { DISTANCE_EPSILON } from './tolerance'

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function pointsCoincide(a: Point2D, b: Point2D): boolean {
  return distance(a, b) <= DISTANCE_EPSILON
}
