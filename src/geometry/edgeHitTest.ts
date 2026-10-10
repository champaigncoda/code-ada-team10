import type { Point2D } from '../types/geometry'
import { getEdge } from './polygon'
import { distanceToSegment } from './segment'
import { imageToScreen, type ViewTransform } from './viewTransform'

/**
 * Index of the closed polygon's edge nearest to a screen-space pointer, or
 * null if none lies within `thresholdPx` screen pixels. Distances are
 * measured on screen to the finite segment, so the tolerance is the same at
 * every zoom level. Exact ties resolve to the lowest edge index.
 */
export function findNearestEdge(
  pointerScreen: Point2D,
  vertices: readonly Point2D[],
  transform: ViewTransform,
  thresholdPx: number,
): number | null {
  let nearestIndex: number | null = null
  let nearestDistance = thresholdPx
  for (let i = 0; i < vertices.length; i++) {
    const [start, end] = getEdge(vertices, i)
    const d = distanceToSegment(pointerScreen, imageToScreen(start, transform), imageToScreen(end, transform))
    if (d < nearestDistance || (d === nearestDistance && nearestIndex === null)) {
      nearestIndex = i
      nearestDistance = d
    }
  }
  return nearestIndex
}
