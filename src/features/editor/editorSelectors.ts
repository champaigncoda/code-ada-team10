import { canConfirmCalibration } from '../calibration/calibrationState'
import { computeWallLengthsMeters } from '../calibration/scale'
import type { ScaleCalibration } from '../../types/calibration'
import type { EditorState } from './editorReducer'

/** Wall lengths in meters while a valid measurement exists (editing or confirmed); otherwise null. */
export function selectWallLengthsMeters(state: EditorState): number[] | null {
  const { calibration, isClosed, polygon } = state
  if (!isClosed || calibration.status === 'uncalibrated') return null
  return computeWallLengthsMeters(polygon.vertices, calibration.reference)
}

export function selectCanConfirmCalibration(state: EditorState): boolean {
  return state.isClosed && canConfirmCalibration(state.calibration, state.polygon.vertices)
}

/**
 * The calibration Phase 3 may build from: present only when the outline is
 * closed and the user has confirmed a measurement that yields a valid scale.
 */
export function selectConfirmedCalibration(state: EditorState): ScaleCalibration | null {
  const { calibration, isClosed, polygon } = state
  if (!isClosed || calibration.status !== 'confirmed') return null
  return computeWallLengthsMeters(polygon.vertices, calibration.reference) ? calibration.reference : null
}

export function selectIsReadyFor3D(state: EditorState): boolean {
  return selectConfirmedCalibration(state) !== null
}
