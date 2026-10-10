import type { Point2D } from '../../types/geometry'
import { type EditorAction, type EditorState, editorReducer, initialEditorState } from './editorReducer'
import type { LoadedFloorPlan } from './loadFloorPlanImage'

export function createFakeFloorPlan(url = 'blob:plan-1', fileName = 'plan.png'): LoadedFloorPlan {
  return {
    image: { fileName, url, size: { width: 1000, height: 800 } },
    // Reducer logic never touches the element; tests run without a real image.
    element: {} as HTMLImageElement,
  }
}

/** 400×300 px rectangle; edges 0 and 2 are horizontal (400 px), 1 and 3 vertical (300 px). */
export const RECTANGLE: readonly Point2D[] = [
  { x: 100, y: 100 },
  { x: 500, y: 100 },
  { x: 500, y: 400 },
  { x: 100, y: 400 },
]

export function reduce(state: EditorState, ...actions: EditorAction[]): EditorState {
  return actions.reduce(editorReducer, state)
}

export function drawingActions(vertices: readonly Point2D[]): EditorAction[] {
  return vertices.map((point) => ({ type: 'canvasClicked', point, isNearFirstVertex: false }) as const)
}

export const CLOSE_ACTION: EditorAction = { type: 'canvasClicked', point: { x: 0, y: 0 }, isNearFirstVertex: true }

export function createClosedState(vertices: readonly Point2D[] = RECTANGLE): EditorState {
  return reduce(
    initialEditorState,
    { type: 'floorPlanLoaded', floorPlan: createFakeFloorPlan() },
    ...drawingActions(vertices),
    CLOSE_ACTION,
  )
}
