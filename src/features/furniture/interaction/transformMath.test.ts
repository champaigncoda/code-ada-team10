import { describe, expect, it } from 'vitest'
import {
  DRAG_THRESHOLD_PX,
  advanceDrag,
  advanceRotate,
  beginDrag,
  beginRotate,
  cameraLocked,
  classifyPointerDown,
  formatDegrees,
  grabOffset,
  normalizeDegrees,
  parseSignedDecimal,
  passedDragThreshold,
  positionFromGrab,
  radiansToDegrees,
  rotationFromPointer,
  signedAngleDelta,
} from './transformMath'

describe('pointer ownership', () => {
  it('gives the primary button on furniture to dragging and the handle to rotation', () => {
    expect(classifyPointerDown({ button: 0, placing: false, target: 'body' })).toBe('drag')
    expect(classifyPointerDown({ button: 0, placing: false, target: 'rotate' })).toBe('rotate')
    expect(classifyPointerDown({ button: 0, placing: false, target: 'empty' })).toBe('camera')
    expect(classifyPointerDown({ button: 2, placing: false, target: 'body' })).toBe('camera')
    expect(classifyPointerDown({ button: 1, placing: false, target: 'rotate' })).toBe('camera')
  })

  it('keeps placement from dragging existing furniture and locks the camera for furniture gestures', () => {
    expect(classifyPointerDown({ button: 0, placing: true, target: 'body' })).toBe('placement')
    expect(cameraLocked('drag')).toBe(true)
    expect(cameraLocked('rotate')).toBe(true)
    expect(cameraLocked('placement')).toBe(true)
    expect(cameraLocked('camera')).toBe(false)
  })

  it('treats a short press as a click', () => {
    expect(passedDragThreshold(10, 10, 10 + DRAG_THRESHOLD_PX - 1, 10)).toBe(false)
    expect(passedDragThreshold(10, 10, 10 + DRAG_THRESHOLD_PX, 10)).toBe(true)
  })
})

describe('furniture dragging', () => {
  it('keeps the grab offset so the piece does not jump', () => {
    const origin = { x: 1, z: 2 }
    const hit = { x: 1.4, z: 2.25 }
    const offset = grabOffset(origin, hit)
    expect(positionFromGrab(hit, offset)).toEqual(origin)
    expect(positionFromGrab({ x: 3, z: 4 }, offset)).toEqual({ x: 2.6, z: 3.75 })
  })

  it('stays still until the threshold, then keeps the last position if the ray misses', () => {
    const gesture = beginDrag('sofa', 0, 0, { x: 1, z: 1 }, { x: 1.2, z: 1.2 })
    const nudged = advanceDrag(gesture, 3, 0, { x: 5, z: 5 })
    expect(nudged.active).toBe(false)
    expect(nudged.position).toEqual({ x: 1, z: 1 })
    const dragged = advanceDrag(gesture, 8, 0, { x: 2, z: 1.2 })
    expect(dragged.position).toEqual({ x: 1.8, z: 1 })
    const missed = advanceDrag(dragged, 20, 0, null)
    expect(missed.position).toEqual(dragged.position)
  })
})

describe('furniture rotation', () => {
  it('applies a signed turn and stays continuous across the ±180° seam', () => {
    expect(signedAngleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2)
    expect(signedAngleDelta(0, -Math.PI / 2)).toBeCloseTo(-Math.PI / 2)
    const from = Math.PI - 0.05
    const to = -Math.PI + 0.05
    expect(signedAngleDelta(from, to)).toBeCloseTo(0.1)
    expect(Math.abs(signedAngleDelta(from, to))).toBeLessThan(Math.PI)
    expect(rotationFromPointer(0.2, from, to)).toBeCloseTo(0.3)
  })

  it('does not rotate before the threshold and keeps the last angle if the pointer leaves the floor', () => {
    const center = { x: 0, z: 0 }
    const gesture = beginRotate('bed', 0, 0, 0, center, { x: 0, z: 1 })
    expect(advanceRotate(gesture, 2, 0, center, { x: 1, z: 0 }).active).toBe(false)
    const turned = advanceRotate(gesture, 12, 0, center, { x: 1, z: 0 })
    expect(turned.rotationY).toBeCloseTo(Math.PI / 2)
    expect(advanceRotate(turned, 20, 0, center, null).rotationY).toBeCloseTo(Math.PI / 2)
  })

  it('normalizes degrees into [0, 360) and formats radians', () => {
    expect(normalizeDegrees(-90)).toBe(270)
    expect(normalizeDegrees(360)).toBe(0)
    expect(formatDegrees(Math.PI)).toBe('180')
    expect(radiansToDegrees(Math.PI / 2)).toBe(90)
  })

  it('accepts signed decimals and treats a trailing dot as incomplete', () => {
    expect(parseSignedDecimal('-1.25')).toEqual({ ok: true, value: -1.25 })
    expect(parseSignedDecimal('-')).toEqual({ ok: false, incomplete: true })
    expect(parseSignedDecimal('1.')).toEqual({ ok: false, incomplete: true })
    expect(parseSignedDecimal('abc').ok).toBe(false)
    expect(parseSignedDecimal('Infinity').ok).toBe(false)
  })
})
