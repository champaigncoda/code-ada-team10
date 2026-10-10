import { canConfirmCalibration } from '../calibration/calibrationState'
import { computeMetersPerPixel, computeWallLengthsMeters } from '../calibration/scale'
import { parseRoomHeight } from '../room/roomHeight'
import type { ScaleCalibration } from '../../types/calibration'
import type { RoomModelSource } from '../../types/room'
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

export function selectRoomHeightMeters(state: EditorState): number | null {
  const parsed = parseRoomHeight(state.roomHeightInput)
  return parsed.ok ? parsed.meters : null
}

/**
 * Everything the 3D room is derived from, or null unless an image is loaded,
 * the outline is closed, its calibration is confirmed and the height is valid.
 * `outline` is the editor's own vertex array, not a copy.
 */
export function selectRoomModelSource(state: EditorState): RoomModelSource | null {
  if (!state.floorPlan || !selectIsReadyFor3D(state)) return null
  const calibration = selectConfirmedCalibration(state)
  const metersPerPixel = calibration && computeMetersPerPixel(state.polygon.vertices, calibration)
  const heightMeters = selectRoomHeightMeters(state)
  if (!metersPerPixel || heightMeters === null) return null
  return { outline: state.polygon.vertices, metersPerPixel, heightMeters }
}

export function selectCanGenerateRoom(state: EditorState): boolean {
  return selectRoomModelSource(state) !== null
}

/** The room the viewer shows: only while the viewer is open and its inputs are still valid. */
export function selectGeneratedRoomSource(state: EditorState): RoomModelSource | null {
  return state.activeView === 'viewer' ? selectRoomModelSource(state) : null
}
