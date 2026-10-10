import { edgeLengths } from '../../geometry/polygon'
import { DISTANCE_EPSILON } from '../../geometry/tolerance'
import type { ScaleCalibration } from '../../types/calibration'
import type { Point2D } from '../../types/geometry'

/**
 * Uniform scale from original image pixels to meters, or null when it cannot
 * be computed safely (edge out of range, zero-length edge, non-finite input).
 */
export function computeMetersPerPixel(vertices: readonly Point2D[], calibration: ScaleCalibration): number | null {
  const { referenceEdgeIndex, referenceLengthMeters } = calibration
  if (!Number.isInteger(referenceEdgeIndex) || referenceEdgeIndex < 0 || referenceEdgeIndex >= vertices.length) {
    return null
  }
  if (vertices.length < 2 || !Number.isFinite(referenceLengthMeters) || referenceLengthMeters <= 0) {
    return null
  }
  const pixelLength = edgeLengths(vertices)[referenceEdgeIndex]
  if (pixelLength === undefined || pixelLength <= DISTANCE_EPSILON) {
    return null
  }
  const metersPerPixel = referenceLengthMeters / pixelLength
  return Number.isFinite(metersPerPixel) && metersPerPixel > 0 ? metersPerPixel : null
}

/** Real-world length of every edge in edge-index order, at full precision. Null if the scale is invalid. */
export function computeWallLengthsMeters(
  vertices: readonly Point2D[],
  calibration: ScaleCalibration,
): number[] | null {
  const metersPerPixel = computeMetersPerPixel(vertices, calibration)
  if (metersPerPixel === null) return null
  return edgeLengths(vertices).map((pixelLength) => pixelLength * metersPerPixel)
}

/** Display-only formatting; never feed the result back into calculations. */
export function formatMeters(meters: number): string {
  return `${meters.toFixed(2)} m`
}
