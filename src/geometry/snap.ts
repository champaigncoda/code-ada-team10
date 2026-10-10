import type { Point2D } from '../types/geometry'
import { distance } from './point'
import { imageToScreen, type ViewTransform } from './viewTransform'

/**
 * Whether a screen-space pointer is within `radiusPx` screen pixels of an
 * image-space target. Measured on screen so the radius feels the same at
 * every zoom level.
 */
export function isWithinScreenRadius(
  pointerScreen: Point2D,
  targetImage: Point2D,
  transform: ViewTransform,
  radiusPx: number,
): boolean {
  return distance(pointerScreen, imageToScreen(targetImage, transform)) <= radiusPx
}
