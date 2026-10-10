import type { Point2D } from './geometry'

/**
 * Maps image pixels to meters via a reference segment of known length,
 * e.g. a wall whose real length is printed on the floor plan.
 * The meters-per-pixel scale is derived from this, not stored.
 */
export interface ScaleCalibration {
  readonly referenceStart: Point2D
  readonly referenceEnd: Point2D
  readonly referenceLengthMeters: number
}
