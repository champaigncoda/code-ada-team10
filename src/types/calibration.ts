/**
 * A validated reference measurement: one edge of the room outline and its
 * real-world length. The meters-per-pixel scale and all wall lengths are
 * derived from this together with the outline, never stored.
 */
export interface ScaleCalibration {
  /** Edge i runs from vertex i to vertex i + 1; the last edge closes back to vertex 0. */
  readonly referenceEdgeIndex: number
  readonly referenceLengthMeters: number
}

export type CalibrationStatus = 'uncalibrated' | 'editing' | 'confirmed'
