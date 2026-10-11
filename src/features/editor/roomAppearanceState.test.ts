import { describe, expect, it } from 'vitest'
import { DEFAULT_ROOM_APPEARANCE } from '../room/appearance'
import type { EditorAction } from './editorReducer'
import { initialEditorState } from './editorReducer'
import { createClosedState, createFakeFloorPlan, reduce } from './editorTestUtils'

const paint = (surface: 'floor' | 'wall', color: string): EditorAction => ({ type: 'roomColorChanged', surface, color })

describe('room appearance in the editor state', () => {
  it('starts with the default colors', () => {
    expect(initialEditorState.roomAppearance).toBe(DEFAULT_ROOM_APPEARANCE)
  })

  it('updates floor and wall colors independently', () => {
    const state = reduce(createClosedState(), paint('floor', '#C8A97E'), paint('wall', '#9caf88'))
    expect(state.roomAppearance).toEqual({ floorColor: '#c8a97e', wallColor: '#9caf88' })
  })

  it('returns the same state for invalid or unchanged colors', () => {
    const state = createClosedState()
    expect(reduce(state, paint('floor', 'blue'))).toBe(state)
    expect(reduce(state, paint('wall', DEFAULT_ROOM_APPEARANCE.wallColor))).toBe(state)
  })

  it('does not touch geometry, calibration or furniture', () => {
    const before = createClosedState()
    const after = reduce(before, paint('floor', '#6b4a2f'))
    expect(after.polygon).toBe(before.polygon)
    expect(after.calibration).toBe(before.calibration)
    expect(after.furnitureSession).toBe(before.furnitureSession)
    expect(after.activeView).toBe(before.activeView)
  })

  it('keeps the chosen colors across clearing the outline and loading a new image', () => {
    const painted = reduce(createClosedState(), paint('floor', '#6b4a2f'), paint('wall', '#8a9bb0'))
    const cleared = reduce(painted, { type: 'polygonCleared' })
    expect(cleared.roomAppearance).toBe(painted.roomAppearance)
    const reloaded = reduce(cleared, { type: 'floorPlanLoaded', floorPlan: createFakeFloorPlan('blob:plan-2') })
    expect(reloaded.roomAppearance).toBe(painted.roomAppearance)
  })
})
