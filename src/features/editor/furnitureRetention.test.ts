import { describe, expect, it } from 'vitest'
import type { EditorAction, EditorState } from './editorReducer'
import { createClosedState, createFakeFloorPlan, reduce } from './editorTestUtils'
import { selectGeneratedRoomSource } from './editorSelectors'

const select = (edgeIndex: number): EditorAction => ({ type: 'referenceEdgeSelected', edgeIndex })
const CONFIRM: EditorAction = { type: 'calibrationConfirmed' }
const GENERATE: EditorAction = { type: 'roomGenerated' }

function viewingWithSofa(): EditorState {
  return reduce(
    createClosedState(),
    select(0),
    { type: 'referenceLengthChanged', input: '4' },
    CONFIRM,
    GENERATE,
    { type: 'furnitureCreateStarted' },
    { type: 'furniturePlacementStarted' },
    { type: 'furniturePlacementAttempted', position: { x: 0.2, z: 0.3 }, inside: true, id: 'sofa-1' },
  )
}

describe('furniture retention across room changes', () => {
  it('keeps furniture when only the room height changes and when the same room is reopened', () => {
    const viewing = viewingWithSofa()
    const taller = reduce(viewing, { type: 'roomHeightChanged', input: '3.1' })
    expect(taller.furnitureSession.instances).toEqual(viewing.furnitureSession.instances)
    expect(taller.furnitureSession.mode).toEqual(viewing.furnitureSession.mode)
    expect(taller.polygon).toBe(viewing.polygon)
    expect(selectGeneratedRoomSource(taller)?.heightMeters).toBe(3.1)

    const back = reduce(taller, { type: 'editorReturned' })
    const reopened = reduce(back, GENERATE)
    expect(reopened.furnitureSession.instances.map((item) => item.id)).toEqual(['sofa-1'])
    expect(reopened.activeView).toBe('viewer')
  })

  it('drops an in-progress placement when leaving the viewer, without creating an instance', () => {
    const placing = reduce(
      viewingWithSofa(),
      { type: 'furnitureCreateStarted' },
      { type: 'furniturePlacementStarted' },
      { type: 'furniturePreviewMoved', position: { x: 0.1, z: 0.1 } },
    )
    expect(placing.furnitureSession.mode.kind).toBe('placement')
    const back = reduce(placing, { type: 'editorReturned' })
    expect(back.furnitureSession.mode.kind).toBe('create')
    expect(back.furnitureSession.instances).toHaveLength(1)
  })

  it('clears placements when calibration or the outline changes', () => {
    const viewing = viewingWithSofa()
    expect(reduce(viewing, { type: 'recalibrationStarted' }).furnitureSession.instances).toEqual([])
    expect(reduce(viewing, { type: 'polygonCleared' }).furnitureSession.instances).toEqual([])
    expect(
      reduce(viewing, { type: 'floorPlanLoaded', floorPlan: createFakeFloorPlan('blob:next') }).furnitureSession.instances,
    ).toEqual([])
  })
})
