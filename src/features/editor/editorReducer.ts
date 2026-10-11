import { isPointInImage } from '../../geometry/imageBounds'
import { pointsCoincide } from '../../geometry/point'
import { validatePolygon } from '../../geometry/polygonValidation'
import type { Point2D, RoomPolygon } from '../../types/geometry'
import type { RoomAppearance, RoomSurface } from '../../types/room'
import {
  type CalibrationState,
  changeReferenceLength,
  confirmCalibration,
  initialCalibrationState,
  selectReferenceEdge,
  startRecalibration,
} from '../calibration/calibrationState'
import {
  initialFurnitureSession,
  interruptFurniturePlacement,
  isFurnitureSessionAction,
  reduceFurnitureSession,
  type FurnitureSession,
  type FurnitureSessionAction,
} from '../furniture/session/furnitureSession'
import { DEFAULT_ROOM_APPEARANCE, changeRoomColor } from '../room/appearance'
import { DEFAULT_ROOM_HEIGHT_INPUT, parseRoomHeight } from '../room/roomHeight'
import { MIN_POLYGON_VERTICES } from './constants'
import { selectRoomModelSource } from './editorSelectors'
import type { LoadedFloorPlan } from './loadFloorPlanImage'

export interface EditorError {
  readonly message: string
  readonly details: readonly string[]
}

export interface EditorState {
  readonly floorPlan: LoadedFloorPlan | null
  readonly polygon: RoomPolygon
  readonly isClosed: boolean
  /** Only meaningful once the polygon is closed; reset whenever the polygon is cleared or replaced. */
  readonly calibration: CalibrationState
  /** Wall height exactly as typed; parsed on use so no rounded copy exists. */
  readonly roomHeightInput: string
  /**
   * Which view is showing. The 3D model is never stored: it is derived from
   * the outline, confirmed calibration and height, and any action that
   * invalidates those inputs returns to the editor.
   */
  readonly activeView: EditorView
  readonly error: EditorError | null
  /**
   * Placed furniture and the viewer's create / place / edit mode.
   * Cleared when the outline or calibration changes. Wall-height edits keep it.
   */
  readonly furnitureSession: FurnitureSession
  /** Floor and wall colors. A visual preference, so it survives outline and image changes. */
  readonly roomAppearance: RoomAppearance
}

export type EditorView = 'editor' | 'viewer'

export type EditorAction =
  | FurnitureSessionAction
  | { readonly type: 'floorPlanLoaded'; readonly floorPlan: LoadedFloorPlan }
  | { readonly type: 'canvasClicked'; readonly point: Point2D; readonly isNearFirstVertex: boolean }
  | { readonly type: 'lastVertexRemoved' }
  | { readonly type: 'polygonCleared' }
  | { readonly type: 'referenceEdgeSelected'; readonly edgeIndex: number }
  | { readonly type: 'referenceLengthChanged'; readonly input: string }
  | { readonly type: 'calibrationConfirmed' }
  | { readonly type: 'recalibrationStarted' }
  | { readonly type: 'roomHeightChanged'; readonly input: string }
  | { readonly type: 'roomGenerated' }
  | { readonly type: 'roomColorChanged'; readonly surface: RoomSurface; readonly color: string }
  | { readonly type: 'editorReturned' }
  | { readonly type: 'errorRaised'; readonly error: EditorError }
  | { readonly type: 'errorDismissed' }

const EMPTY_POLYGON: RoomPolygon = { vertices: [] }

export const initialEditorState: EditorState = {
  floorPlan: null,
  polygon: EMPTY_POLYGON,
  isClosed: false,
  calibration: initialCalibrationState,
  roomHeightInput: DEFAULT_ROOM_HEIGHT_INPUT,
  activeView: 'editor',
  error: null,
  furnitureSession: initialFurnitureSession(),
  roomAppearance: DEFAULT_ROOM_APPEARANCE,
}

function withCalibration(state: EditorState, calibration: CalibrationState): EditorState {
  if (!state.isClosed || calibration === state.calibration) return state
  return { ...state, calibration }
}

function withError(state: EditorState, message: string, details: readonly string[] = []): EditorState {
  return { ...state, error: { message, details } }
}

function placeVertex(state: EditorState, point: Point2D): EditorState {
  if (!state.floorPlan) return state
  if (!isPointInImage(point, state.floorPlan.image.size)) {
    return withError(state, 'Vertices must be placed inside the floor plan image.')
  }
  const last = state.polygon.vertices.at(-1)
  if (last && pointsCoincide(last, point)) {
    return withError(state, 'That point is at the same position as the previous vertex.')
  }
  return { ...state, polygon: { vertices: [...state.polygon.vertices, point] }, furnitureSession: initialFurnitureSession(), error: null }
}

function closePolygon(state: EditorState): EditorState {
  const result = validatePolygon(state.polygon.vertices)
  if (!result.isValid) {
    return withError(
      state,
      "The outline can't be closed because it isn't a valid room shape. Use Undo to remove vertices, or Clear to start over.",
      result.issues.map((issue) => issue.message),
    )
  }
  return { ...state, isClosed: true, error: null }
}

function handleCanvasClick(state: EditorState, point: Point2D, isNearFirstVertex: boolean): EditorState {
  if (state.isClosed) {
    return withError(state, 'The room outline is already closed. Clear it to draw a new one.')
  }
  if (!isNearFirstVertex) {
    return placeVertex(state, point)
  }
  if (state.polygon.vertices.length < MIN_POLYGON_VERTICES) {
    return withError(state, `Place at least ${MIN_POLYGON_VERTICES} vertices before closing the outline.`)
  }
  return closePolygon(state)
}

function generateRoom(state: EditorState): EditorState {
  if (!selectRoomModelSource(state)) {
    return withError(
      state,
      "The 3D room can't be generated yet. Close the outline, confirm its dimensions and enter a valid room height.",
    )
  }
  return { ...state, activeView: 'viewer', error: null }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (isFurnitureSessionAction(action)) {
    const furnitureSession = reduceFurnitureSession(state.furnitureSession, action)
    return furnitureSession === state.furnitureSession ? state : { ...state, furnitureSession }
  }
  switch (action.type) {
    case 'floorPlanLoaded':
      // The height describes the room being modeled, not the image, so it survives a replacement.
      return {
        ...initialEditorState,
        floorPlan: action.floorPlan,
        roomHeightInput: state.roomHeightInput,
        roomAppearance: state.roomAppearance,
      }
    case 'canvasClicked':
      return handleCanvasClick(state, action.point, action.isNearFirstVertex)
    case 'lastVertexRemoved':
      if (state.isClosed || state.polygon.vertices.length === 0) return state
      return {
        ...state,
        polygon: { vertices: state.polygon.vertices.slice(0, -1) },
        furnitureSession: initialFurnitureSession(),
        error: null,
      }
    case 'polygonCleared':
      return {
        ...state,
        polygon: EMPTY_POLYGON,
        isClosed: false,
        calibration: initialCalibrationState,
        activeView: 'editor',
        furnitureSession: initialFurnitureSession(),
        error: null,
      }
    case 'referenceEdgeSelected':
      return withCalibration(
        state,
        selectReferenceEdge(state.calibration, action.edgeIndex, state.polygon.vertices.length),
      )
    case 'referenceLengthChanged':
      return withCalibration(state, changeReferenceLength(state.calibration, action.input))
    case 'calibrationConfirmed': {
      const next = withCalibration(state, confirmCalibration(state.calibration, state.polygon.vertices))
      // A newly confirmed scale is a different room. Do not reuse old placements.
      return next === state ? state : { ...next, furnitureSession: initialFurnitureSession() }
    }
    case 'recalibrationStarted': {
      const next = withCalibration(state, startRecalibration(state.calibration))
      return next === state ? state : { ...next, activeView: 'editor', furnitureSession: initialFurnitureSession() }
    }
    case 'roomHeightChanged': {
      const heightIsValid = parseRoomHeight(action.input).ok
      return {
        ...state,
        roomHeightInput: action.input,
        activeView: heightIsValid ? state.activeView : 'editor',
        furnitureSession: heightIsValid ? state.furnitureSession : interruptFurniturePlacement(state.furnitureSession),
      }
    }
    case 'roomGenerated':
      return generateRoom(state)
    case 'roomColorChanged': {
      const roomAppearance = changeRoomColor(state.roomAppearance, action.surface, action.color)
      return roomAppearance === state.roomAppearance ? state : { ...state, roomAppearance }
    }
    case 'editorReturned':
      if (state.activeView === 'editor') return state
      return { ...state, activeView: 'editor', furnitureSession: interruptFurniturePlacement(state.furnitureSession) }
    case 'errorRaised':
      return { ...state, error: action.error }
    case 'errorDismissed':
      return { ...state, error: null }
  }
}
