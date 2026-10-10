import { describe, expect, it } from 'vitest'
import type { EditorAction, EditorState } from './editorReducer'
import { initialEditorState } from './editorReducer'
import { CLOSE_ACTION, RECTANGLE, createClosedState, createFakeFloorPlan, drawingActions, reduce } from './editorTestUtils'
import {
  selectCanConfirmCalibration,
  selectConfirmedCalibration,
  selectIsReadyFor3D,
  selectWallLengthsMeters,
} from './editorSelectors'

const select = (edgeIndex: number): EditorAction => ({ type: 'referenceEdgeSelected', edgeIndex })
const typeLength = (input: string): EditorAction => ({ type: 'referenceLengthChanged', input })
const CONFIRM: EditorAction = { type: 'calibrationConfirmed' }
const RECALIBRATE: EditorAction = { type: 'recalibrationStarted' }

function confirmedState(): EditorState {
  return reduce(createClosedState(), select(0), typeLength('4'), CONFIRM)
}

describe('calibration state transitions', () => {
  it('starts uncalibrated with nothing selected', () => {
    const state = createClosedState()
    expect(state.isClosed).toBe(true)
    expect(state.calibration).toEqual({ status: 'uncalibrated', referenceEdgeIndex: null, lengthInput: '' })
    expect(selectWallLengthsMeters(state)).toBeNull()
  })

  it('ignores calibration actions until the polygon is closed', () => {
    const drawing = reduce(
      initialEditorState,
      { type: 'floorPlanLoaded', floorPlan: createFakeFloorPlan() },
      ...drawingActions(RECTANGLE),
    )
    expect(reduce(drawing, select(0), typeLength('4'), CONFIRM).calibration).toBe(drawing.calibration)
  })

  it('enables confirmation once a valid measurement is entered', () => {
    const state = reduce(createClosedState(), select(0), typeLength('4'))
    expect(state.calibration).toEqual({
      status: 'editing',
      reference: { referenceEdgeIndex: 0, referenceLengthMeters: 4 },
      lengthInput: '4',
    })
    expect(selectCanConfirmCalibration(state)).toBe(true)
    expect(selectWallLengthsMeters(state)).toEqual([4, 3, 4, 3])
  })

  it.each(['', '   ', '0', '-3', 'abc', 'NaN', 'Infinity', '1e999'])(
    'prevents confirmation with invalid measurement %j',
    (input) => {
      const state = reduce(createClosedState(), select(0), typeLength(input))
      expect(state.calibration.status).toBe('uncalibrated')
      expect(selectCanConfirmCalibration(state)).toBe(false)
      expect(selectWallLengthsMeters(state)).toBeNull()
      expect(reduce(state, CONFIRM).calibration.status).toBe('uncalibrated')
    },
  )

  it('prevents confirmation when no wall is selected', () => {
    const state = reduce(createClosedState(), typeLength('4'), CONFIRM)
    expect(state.calibration).toEqual({ status: 'uncalibrated', referenceEdgeIndex: null, lengthInput: '' })
  })

  it('goes back to uncalibrated when a valid measurement is edited into an invalid one', () => {
    const state = reduce(createClosedState(), select(0), typeLength('4'), typeLength('4x'))
    expect(state.calibration).toEqual({ status: 'uncalibrated', referenceEdgeIndex: 0, lengthInput: '4x' })
  })

  it('transitions to confirmed on Confirm Dimensions', () => {
    const state = confirmedState()
    expect(state.calibration.status).toBe('confirmed')
    expect(selectWallLengthsMeters(state)).toEqual([4, 3, 4, 3])
  })

  it('blocks wall selection and measurement edits once confirmed', () => {
    const confirmed = confirmedState()
    expect(reduce(confirmed, select(1))).toBe(confirmed)
    expect(reduce(confirmed, typeLength('9'))).toBe(confirmed)
    expect(reduce(confirmed, CONFIRM)).toBe(confirmed)
  })

  it('unlocks on Re-calibrate while keeping the reference wall and measurement', () => {
    const state = reduce(confirmedState(), RECALIBRATE)
    expect(state.calibration).toEqual({
      status: 'editing',
      reference: { referenceEdgeIndex: 0, referenceLengthMeters: 4 },
      lengthInput: '4',
    })
    const updated = reduce(state, typeLength('8'))
    expect(selectWallLengthsMeters(updated)).toEqual([8, 6, 8, 6])
  })

  it('invalidates the previous measurement when a different wall is selected', () => {
    const editing = reduce(createClosedState(), select(0), typeLength('4'))
    const switched = reduce(editing, select(1))
    expect(switched.calibration).toEqual({ status: 'uncalibrated', referenceEdgeIndex: 1, lengthInput: '' })
    expect(selectWallLengthsMeters(switched)).toBeNull()

    // After Re-calibrate, switching walls also requires a new measurement.
    const recalibrated = reduce(confirmedState(), RECALIBRATE, select(2))
    expect(recalibrated.calibration).toEqual({ status: 'uncalibrated', referenceEdgeIndex: 2, lengthInput: '' })
  })

  it('keeps the measurement when the same wall is selected again', () => {
    const editing = reduce(createClosedState(), select(0), typeLength('4'))
    expect(reduce(editing, select(0))).toBe(editing)
  })

  it('ignores out-of-range edge indices', () => {
    const state = createClosedState()
    expect(reduce(state, select(4))).toBe(state)
    expect(reduce(state, select(-1))).toBe(state)
  })

  it('resets calibration when the polygon is cleared', () => {
    const cleared = reduce(confirmedState(), { type: 'polygonCleared' })
    expect(cleared.calibration).toEqual({ status: 'uncalibrated', referenceEdgeIndex: null, lengthInput: '' })
    expect(cleared.polygon.vertices).toEqual([])
    expect(cleared.floorPlan).not.toBeNull()
  })

  it('resets calibration when a different image is loaded successfully', () => {
    const replaced = reduce(confirmedState(), { type: 'floorPlanLoaded', floorPlan: createFakeFloorPlan('blob:plan-2') })
    expect(replaced.calibration).toEqual({ status: 'uncalibrated', referenceEdgeIndex: null, lengthInput: '' })
    expect(replaced.polygon.vertices).toEqual([])
    expect(replaced.isClosed).toBe(false)
  })

  it('preserves image, polygon and confirmed calibration when an upload fails', () => {
    const confirmed = confirmedState()
    const failed = reduce(confirmed, {
      type: 'errorRaised',
      error: { message: '"plan.pdf" is not a supported file type.', details: [] },
    })
    expect(failed.calibration).toBe(confirmed.calibration)
    expect(failed.polygon).toBe(confirmed.polygon)
    expect(failed.floorPlan).toBe(confirmed.floorPlan)
    expect(failed.error).not.toBeNull()
  })

  it('never changes polygon coordinates during calibration', () => {
    const closed = createClosedState()
    const states = [
      reduce(closed, select(0)),
      reduce(closed, select(0), typeLength('4')),
      reduce(closed, select(0), typeLength('4'), CONFIRM),
      reduce(closed, select(0), typeLength('4'), CONFIRM, RECALIBRATE, select(3), typeLength('2.75')),
    ]
    for (const state of states) {
      expect(state.polygon).toBe(closed.polygon)
      expect(state.polygon.vertices).toEqual(RECTANGLE)
    }
  })
})

describe('Phase 3 readiness', () => {
  it('is ready only for a valid, confirmed calibration', () => {
    const closed = createClosedState()
    const editing = reduce(closed, select(0), typeLength('4'))
    const confirmed = reduce(editing, CONFIRM)

    expect(selectIsReadyFor3D(initialEditorState)).toBe(false)
    expect(selectIsReadyFor3D(closed)).toBe(false)
    expect(selectIsReadyFor3D(reduce(closed, select(0)))).toBe(false)
    expect(selectIsReadyFor3D(editing)).toBe(false)
    expect(selectIsReadyFor3D(confirmed)).toBe(true)
    expect(selectConfirmedCalibration(confirmed)).toEqual({ referenceEdgeIndex: 0, referenceLengthMeters: 4 })
    expect(selectIsReadyFor3D(reduce(confirmed, RECALIBRATE))).toBe(false)
    expect(selectIsReadyFor3D(reduce(confirmed, { type: 'polygonCleared' }))).toBe(false)
  })

  it('rejects a confirmed status whose reference no longer yields a valid scale', () => {
    const confirmed = confirmedState()
    const corrupted: EditorState = {
      ...confirmed,
      calibration: { status: 'confirmed', reference: { referenceEdgeIndex: 9, referenceLengthMeters: 4 }, lengthInput: '4' },
    }
    expect(selectIsReadyFor3D(corrupted)).toBe(false)
    expect(selectConfirmedCalibration({ ...confirmed, isClosed: false })).toBeNull()
  })

  it('keeps an L-shaped room ready after confirmation', () => {
    const lShape = [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
      { x: 300, y: 200 },
      { x: 200, y: 200 },
      { x: 200, y: 400 },
      { x: 100, y: 400 },
    ]
    const state = reduce(
      initialEditorState,
      { type: 'floorPlanLoaded', floorPlan: createFakeFloorPlan() },
      ...drawingActions(lShape),
      CLOSE_ACTION,
      select(5),
      typeLength('4.5'),
      CONFIRM,
    )
    expect(selectIsReadyFor3D(state)).toBe(true)
    const lengths = selectWallLengthsMeters(state) ?? []
    ;[3, 1.5, 1.5, 3, 1.5, 4.5].forEach((expected, i) => expect(lengths[i]).toBeCloseTo(expected, 12))
  })
})
