import type { ScaleCalibration } from '../../types/calibration'
import type { Point2D } from '../../types/geometry'
import { parseReferenceLength } from './referenceLength'
import { computeMetersPerPixel } from './scale'

/**
 * `status` is the single source of truth. Only `editing` and `confirmed`
 * carry a validated `reference`, so a usable measurement can't exist
 * without one. `lengthInput` keeps the text exactly as typed.
 */
export type CalibrationState =
  | {
      readonly status: 'uncalibrated'
      readonly referenceEdgeIndex: number | null
      readonly lengthInput: string
    }
  | {
      readonly status: 'editing' | 'confirmed'
      readonly reference: ScaleCalibration
      readonly lengthInput: string
    }

export const initialCalibrationState: CalibrationState = {
  status: 'uncalibrated',
  referenceEdgeIndex: null,
  lengthInput: '',
}

export function getReferenceEdgeIndex(calibration: CalibrationState): number | null {
  return calibration.status === 'uncalibrated' ? calibration.referenceEdgeIndex : calibration.reference.referenceEdgeIndex
}

export function isCalibrationEditable(calibration: CalibrationState): boolean {
  return calibration.status !== 'confirmed'
}

/** Choosing a different wall discards the previous measurement so it can't be applied to the wrong edge. */
export function selectReferenceEdge(
  calibration: CalibrationState,
  edgeIndex: number,
  edgeCount: number,
): CalibrationState {
  if (!isCalibrationEditable(calibration)) return calibration
  if (!Number.isInteger(edgeIndex) || edgeIndex < 0 || edgeIndex >= edgeCount) return calibration
  if (getReferenceEdgeIndex(calibration) === edgeIndex) return calibration
  return { status: 'uncalibrated', referenceEdgeIndex: edgeIndex, lengthInput: '' }
}

export function changeReferenceLength(calibration: CalibrationState, lengthInput: string): CalibrationState {
  if (!isCalibrationEditable(calibration)) return calibration
  const referenceEdgeIndex = getReferenceEdgeIndex(calibration)
  if (referenceEdgeIndex === null) return calibration

  const parsed = parseReferenceLength(lengthInput)
  if (!parsed.ok) {
    return { status: 'uncalibrated', referenceEdgeIndex, lengthInput }
  }
  return { status: 'editing', reference: { referenceEdgeIndex, referenceLengthMeters: parsed.meters }, lengthInput }
}

export function canConfirmCalibration(calibration: CalibrationState, vertices: readonly Point2D[]): boolean {
  return calibration.status === 'editing' && computeMetersPerPixel(vertices, calibration.reference) !== null
}

export function confirmCalibration(calibration: CalibrationState, vertices: readonly Point2D[]): CalibrationState {
  if (!canConfirmCalibration(calibration, vertices) || calibration.status === 'uncalibrated') return calibration
  return { ...calibration, status: 'confirmed' }
}

/** Unlocks a confirmed calibration, keeping its reference wall and measurement. */
export function startRecalibration(calibration: CalibrationState): CalibrationState {
  if (calibration.status !== 'confirmed') return calibration
  return { ...calibration, status: 'editing' }
}
