import { isPointInImage } from '../../geometry/imageBounds'
import { pointsCoincide } from '../../geometry/point'
import { validatePolygon } from '../../geometry/polygonValidation'
import type { Point2D, RoomPolygon } from '../../types/geometry'
import {
  type CalibrationState,
  changeReferenceLength,
  confirmCalibration,
  initialCalibrationState,
  selectReferenceEdge,
  startRecalibration,
} from '../calibration/calibrationState'
import { MIN_POLYGON_VERTICES } from './constants'
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
  readonly error: EditorError | null
}

export type EditorAction =
  | { readonly type: 'floorPlanLoaded'; readonly floorPlan: LoadedFloorPlan }
  | { readonly type: 'canvasClicked'; readonly point: Point2D; readonly isNearFirstVertex: boolean }
  | { readonly type: 'lastVertexRemoved' }
  | { readonly type: 'polygonCleared' }
  | { readonly type: 'referenceEdgeSelected'; readonly edgeIndex: number }
  | { readonly type: 'referenceLengthChanged'; readonly input: string }
  | { readonly type: 'calibrationConfirmed' }
  | { readonly type: 'recalibrationStarted' }
  | { readonly type: 'errorRaised'; readonly error: EditorError }
  | { readonly type: 'errorDismissed' }

const EMPTY_POLYGON: RoomPolygon = { vertices: [] }

export const initialEditorState: EditorState = {
  floorPlan: null,
  polygon: EMPTY_POLYGON,
  isClosed: false,
  calibration: initialCalibrationState,
  error: null,
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
  return { ...state, polygon: { vertices: [...state.polygon.vertices, point] }, error: null }
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

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'floorPlanLoaded':
      return { ...initialEditorState, floorPlan: action.floorPlan }
    case 'canvasClicked':
      return handleCanvasClick(state, action.point, action.isNearFirstVertex)
    case 'lastVertexRemoved':
      if (state.isClosed || state.polygon.vertices.length === 0) return state
      return { ...state, polygon: { vertices: state.polygon.vertices.slice(0, -1) }, error: null }
    case 'polygonCleared':
      return { ...state, polygon: EMPTY_POLYGON, isClosed: false, calibration: initialCalibrationState, error: null }
    case 'referenceEdgeSelected':
      return withCalibration(
        state,
        selectReferenceEdge(state.calibration, action.edgeIndex, state.polygon.vertices.length),
      )
    case 'referenceLengthChanged':
      return withCalibration(state, changeReferenceLength(state.calibration, action.input))
    case 'calibrationConfirmed':
      return withCalibration(state, confirmCalibration(state.calibration, state.polygon.vertices))
    case 'recalibrationStarted':
      return withCalibration(state, startRecalibration(state.calibration))
    case 'errorRaised':
      return { ...state, error: action.error }
    case 'errorDismissed':
      return { ...state, error: null }
  }
}
