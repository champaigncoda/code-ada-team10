import { boundingBoxCenter } from '../../../geometry/polygon'
import type { Point2D } from '../../../types/geometry'
import type { FloorBounds, FloorPoint } from '../../../types/room'

/**
 * Maps an image-pixel point onto the floor plane in meters:
 *   x = (px − centerX) · metersPerPixel,  z = (py − centerY) · metersPerPixel
 * One uniform factor for both axes preserves every length ratio and angle.
 */
export function imagePointToFloor(point: Point2D, center: Point2D, metersPerPixel: number): FloorPoint {
  return {
    x: (point.x - center.x) * metersPerPixel,
    z: (point.y - center.y) * metersPerPixel,
  }
}

/**
 * Converts the stored outline (original image pixels) into a footprint in
 * meters centered on the origin. Works purely in image space, so the 2D
 * canvas zoom and pan have no influence. Vertex order is kept as drawn.
 */
export function outlineToFloorFootprint(outline: readonly Point2D[], metersPerPixel: number): FloorPoint[] {
  if (outline.length === 0) return []
  const center = boundingBoxCenter(outline)
  return outline.map((point) => imagePointToFloor(point, center, metersPerPixel))
}

export function floorBounds(footprint: readonly FloorPoint[]): FloorBounds {
  if (footprint.length === 0) {
    throw new RangeError('Floor bounds need at least one point')
  }
  const minX = Math.min(...footprint.map((p) => p.x))
  const maxX = Math.max(...footprint.map((p) => p.x))
  const minZ = Math.min(...footprint.map((p) => p.z))
  const maxZ = Math.max(...footprint.map((p) => p.z))
  return { minX, maxX, minZ, maxZ, width: maxX - minX, depth: maxZ - minZ }
}

/** Lets the image-space polygon helpers (shoelace area, etc.) run on floor points. */
export function floorPointsAsPlanar(footprint: readonly FloorPoint[]): Point2D[] {
  return footprint.map((p) => ({ x: p.x, y: p.z }))
}
