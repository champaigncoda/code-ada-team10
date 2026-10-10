import { describe, expect, it } from 'vitest'
import { buildRoomGeometry } from '../viewer/geometry/roomGeometry'
import type { EditorAction, EditorState } from './editorReducer'
import { initialEditorState } from './editorReducer'
import { CLOSE_ACTION, RECTANGLE, createClosedState, createFakeFloorPlan, drawingActions, reduce } from './editorTestUtils'
import {
  selectCanGenerateRoom,
  selectGeneratedRoomSource,
  selectIsReadyFor3D,
  selectRoomModelSource,
} from './editorSelectors'

const select = (edgeIndex: number): EditorAction => ({ type: 'referenceEdgeSelected', edgeIndex })
const typeLength = (input: string): EditorAction => ({ type: 'referenceLengthChanged', input })
const CONFIRM: EditorAction = { type: 'calibrationConfirmed' }
const GENERATE: EditorAction = { type: 'roomGenerated' }

function confirmedState(): EditorState {
  return reduce(createClosedState(), select(0), typeLength('4'), CONFIRM)
}

describe('3D generation readiness', () => {
  it('stays disabled without a confirmed calibration', () => {
    expect(selectCanGenerateRoom(createClosedState())).toBe(false)
    expect(selectCanGenerateRoom(reduce(createClosedState(), select(0), typeLength('4')))).toBe(false)
    expect(selectIsReadyFor3D(reduce(createClosedState(), select(0), typeLength('4')))).toBe(false)
  })

  it('stays disabled when the room height is invalid', () => {
    const confirmed = confirmedState()
    const invalid = reduce(confirmed, { type: 'roomHeightChanged', input: '0' })
    expect(selectIsReadyFor3D(invalid)).toBe(true)
    expect(selectCanGenerateRoom(invalid)).toBe(false)
    expect(reduce(invalid, GENERATE).activeView).toBe('editor')
    expect(reduce(invalid, GENERATE).error?.message).toMatch(/can't be generated/)
  })

  it('enables generation once calibration is confirmed and the height is valid', () => {
    const confirmed = confirmedState()
    expect(confirmed.roomHeightInput).toBe('2.8')
    expect(selectCanGenerateRoom(confirmed)).toBe(true)
    const generated = reduce(confirmed, GENERATE)
    expect(generated.activeView).toBe('viewer')
    expect(selectGeneratedRoomSource(generated)?.heightMeters).toBe(2.8)
    expect(selectGeneratedRoomSource(generated)?.outline).toBe(generated.polygon.vertices)
  })

  it('updates the derived room when the height changes', () => {
    const generated = reduce(confirmedState(), GENERATE, { type: 'roomHeightChanged', input: '3.25' })
    expect(generated.activeView).toBe('viewer')
    const source = selectGeneratedRoomSource(generated)
    expect(source?.heightMeters).toBe(3.25)
    expect(buildRoomGeometry(source!)?.heightMeters).toBe(3.25)
    expect(buildRoomGeometry(source!)?.walls.every((wall) => wall.heightMeters === 3.25)).toBe(true)
  })

  it('leaves the viewer when the user re-calibrates', () => {
    const viewing = reduce(confirmedState(), GENERATE)
    const recalibrated = reduce(viewing, { type: 'recalibrationStarted' })
    expect(recalibrated.activeView).toBe('editor')
    expect(selectGeneratedRoomSource(recalibrated)).toBeNull()
    expect(recalibrated.calibration.status).toBe('editing')
    expect(recalibrated.polygon).toBe(viewing.polygon)
    expect(recalibrated.floorPlan).toBe(viewing.floorPlan)
  })

  it('invalidates the generated room when the polygon is cleared', () => {
    const cleared = reduce(confirmedState(), GENERATE, { type: 'polygonCleared' })
    expect(cleared.activeView).toBe('editor')
    expect(selectGeneratedRoomSource(cleared)).toBeNull()
    expect(selectRoomModelSource(cleared)).toBeNull()
    expect(cleared.floorPlan).not.toBeNull()
  })

  it('invalidates the generated room when a new image loads', () => {
    const replaced = reduce(confirmedState(), GENERATE, {
      type: 'floorPlanLoaded',
      floorPlan: createFakeFloorPlan('blob:next', 'next.png'),
    })
    expect(replaced.activeView).toBe('editor')
    expect(replaced.polygon.vertices).toEqual([])
    expect(selectGeneratedRoomSource(replaced)).toBeNull()
    expect(replaced.roomHeightInput).toBe('2.8')
  })

  it('returns to the editor without dropping the image, outline or calibration', () => {
    const viewing = reduce(confirmedState(), GENERATE)
    const back = reduce(viewing, { type: 'editorReturned' })
    expect(back.activeView).toBe('editor')
    expect(back.floorPlan).toBe(viewing.floorPlan)
    expect(back.polygon).toBe(viewing.polygon)
    expect(back.calibration).toBe(viewing.calibration)
    expect(back.roomHeightInput).toBe(viewing.roomHeightInput)
    expect(selectCanGenerateRoom(back)).toBe(true)
    expect(selectGeneratedRoomSource(back)).toBeNull()
  })

  it('does not copy the outline when building the room source', () => {
    const confirmed = confirmedState()
    const source = selectRoomModelSource(confirmed)
    expect(source?.outline).toBe(confirmed.polygon.vertices)
    const drawing = reduce(
      initialEditorState,
      { type: 'floorPlanLoaded', floorPlan: createFakeFloorPlan() },
      ...drawingActions(RECTANGLE),
    )
    expect(selectCanGenerateRoom(reduce(drawing, CLOSE_ACTION))).toBe(false)
  })
})
