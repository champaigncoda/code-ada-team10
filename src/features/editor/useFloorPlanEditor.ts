import { useCallback, useReducer, useRef } from 'react'
import type { Point2D } from '../../types/geometry'
import type { RoomSurface } from '../../types/room'
import type { FurnitureSessionAction } from '../furniture/session/furnitureSession'
import { editorReducer, initialEditorState } from './editorReducer'
import { loadFloorPlanImage } from './loadFloorPlanImage'

export function useFloorPlanEditor() {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState)
  const activeImageUrlRef = useRef<string | null>(null)

  async function uploadFile(file: File): Promise<void> {
    const result = await loadFloorPlanImage(file)
    if (!result.ok) {
      dispatch({ type: 'errorRaised', error: { message: result.message, details: [] } })
      return
    }
    if (activeImageUrlRef.current) {
      URL.revokeObjectURL(activeImageUrlRef.current)
    }
    activeImageUrlRef.current = result.floorPlan.image.url
    dispatch({ type: 'floorPlanLoaded', floorPlan: result.floorPlan })
  }

  const applyFurniture = useCallback((action: FurnitureSessionAction) => {
    dispatch(action)
  }, [])

  return {
    state,
    applyFurniture,
    uploadFile,
    clickCanvas: (point: Point2D, isNearFirstVertex: boolean) =>
      dispatch({ type: 'canvasClicked', point, isNearFirstVertex }),
    undoLastVertex: () => dispatch({ type: 'lastVertexRemoved' }),
    clearPolygon: () => dispatch({ type: 'polygonCleared' }),
    selectReferenceEdge: (edgeIndex: number) => dispatch({ type: 'referenceEdgeSelected', edgeIndex }),
    changeReferenceLength: (input: string) => dispatch({ type: 'referenceLengthChanged', input }),
    confirmCalibration: () => dispatch({ type: 'calibrationConfirmed' }),
    startRecalibration: () => dispatch({ type: 'recalibrationStarted' }),
    changeRoomHeight: (input: string) => dispatch({ type: 'roomHeightChanged', input }),
    generateRoom: () => dispatch({ type: 'roomGenerated' }),
    changeRoomColor: (surface: RoomSurface, color: string) => dispatch({ type: 'roomColorChanged', surface, color }),
    returnToEditor: () => dispatch({ type: 'editorReturned' }),
    dismissError: () => dispatch({ type: 'errorDismissed' }),
  }
}
