import type { ScaleCalibration } from './calibration'
import type { RoomPolygon } from './geometry'

/**
 * Vertical properties that cannot be read from a 2D floor plan.
 * Horizontal extents come from the outline combined with the calibration.
 */
export interface RoomDimensions {
  readonly wallHeightMeters: number
  readonly wallThicknessMeters: number
}

/**
 * Everything needed to generate a 3D room: the footprint (outline),
 * its real-world scale (calibration), and its extrusion (dimensions).
 */
export interface Room {
  readonly id: string
  readonly outline: RoomPolygon
  /** Null until the user has confirmed a calibration. */
  readonly calibration: ScaleCalibration | null
  readonly dimensions: RoomDimensions
}
