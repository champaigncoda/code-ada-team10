// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RECTANGLE, createFakeFloorPlan } from './editorTestUtils'
import { selectCanGenerateRoom, selectGeneratedRoomSource, selectIsReadyFor3D } from './editorSelectors'
import type * as LoaderModule from './loadFloorPlanImage'
import { loadFloorPlanImage } from './loadFloorPlanImage'
import { useFloorPlanEditor } from './useFloorPlanEditor'

// Real loader by default (its type check rejects non-images before touching the DOM);
// successful decodes are stubbed per test because jsdom cannot decode images.
vi.mock('./loadFloorPlanImage', async (importOriginal) => {
  const actual = await importOriginal<typeof LoaderModule>()
  return { ...actual, loadFloorPlanImage: vi.fn(actual.loadFloorPlanImage) }
})

const revokeObjectURL = vi.fn()

beforeEach(() => {
  revokeObjectURL.mockClear()
  Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true, writable: true })
})

afterEach(cleanup)

async function setUpConfirmedRoom() {
  vi.mocked(loadFloorPlanImage).mockResolvedValueOnce({ ok: true, floorPlan: createFakeFloorPlan('blob:first') })
  const hook = renderHook(() => useFloorPlanEditor())
  await act(() => hook.result.current.uploadFile(new File(['png'], 'first.png', { type: 'image/png' })))
  act(() => {
    for (const vertex of RECTANGLE) hook.result.current.clickCanvas(vertex, false)
  })
  act(() => hook.result.current.clickCanvas({ x: 0, y: 0 }, true))
  act(() => hook.result.current.selectReferenceEdge(1))
  act(() => hook.result.current.changeReferenceLength('3'))
  act(() => hook.result.current.confirmCalibration())
  return hook
}

describe('useFloorPlanEditor upload flow', () => {
  it('keeps the image, polygon and confirmed calibration when a replacement upload fails', async () => {
    const hook = await setUpConfirmedRoom()
    const before = hook.result.current.state
    expect(before.calibration.status).toBe('confirmed')
    expect(selectIsReadyFor3D(before)).toBe(true)

    await act(() => hook.result.current.uploadFile(new File(['%PDF'], 'plan.pdf', { type: 'application/pdf' })))

    const after = hook.result.current.state
    expect(after.error?.message).toMatch(/not a supported file type/)
    expect(after.floorPlan).toBe(before.floorPlan)
    expect(after.polygon).toBe(before.polygon)
    expect(after.calibration).toBe(before.calibration)
    expect(selectIsReadyFor3D(after)).toBe(true)
    expect(revokeObjectURL).not.toHaveBeenCalled()
  })

  it('resets polygon and calibration when a replacement upload succeeds', async () => {
    const hook = await setUpConfirmedRoom()
    vi.mocked(loadFloorPlanImage).mockResolvedValueOnce({ ok: true, floorPlan: createFakeFloorPlan('blob:second', 'second.png') })

    await act(() => hook.result.current.uploadFile(new File(['png'], 'second.png', { type: 'image/png' })))

    const state = hook.result.current.state
    expect(state.floorPlan?.image.fileName).toBe('second.png')
    expect(state.polygon.vertices).toEqual([])
    expect(state.isClosed).toBe(false)
    expect(state.calibration).toEqual({ status: 'uncalibrated', referenceEdgeIndex: null, lengthInput: '' })
    expect(selectIsReadyFor3D(state)).toBe(false)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first')
  })
})

describe('useFloorPlanEditor 3D generation', () => {
  it('opens the viewer and returns to the editor without losing the room', async () => {
    const hook = await setUpConfirmedRoom()
    act(() => hook.result.current.generateRoom())
    expect(hook.result.current.state.activeView).toBe('viewer')
    expect(selectGeneratedRoomSource(hook.result.current.state)?.heightMeters).toBe(2.8)

    const viewing = hook.result.current.state
    act(() => hook.result.current.returnToEditor())
    const back = hook.result.current.state
    expect(back.activeView).toBe('editor')
    expect(back.polygon).toBe(viewing.polygon)
    expect(back.calibration).toBe(viewing.calibration)
    expect(back.floorPlan).toBe(viewing.floorPlan)
    expect(selectCanGenerateRoom(back)).toBe(true)
  })

  it('drops the generated room after a successful image replacement', async () => {
    const hook = await setUpConfirmedRoom()
    act(() => hook.result.current.generateRoom())
    vi.mocked(loadFloorPlanImage).mockResolvedValueOnce({
      ok: true,
      floorPlan: createFakeFloorPlan('blob:second', 'second.png'),
    })
    await act(() => hook.result.current.uploadFile(new File(['png'], 'second.png', { type: 'image/png' })))
    expect(hook.result.current.state.activeView).toBe('editor')
    expect(selectGeneratedRoomSource(hook.result.current.state)).toBeNull()
  })
})
