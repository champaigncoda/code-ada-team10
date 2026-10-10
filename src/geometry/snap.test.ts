import { describe, expect, it } from 'vitest'
import { isWithinScreenRadius } from './snap'
import { type ViewTransform, imageToScreen } from './viewTransform'

const SNAP_RADIUS = 15
const firstVertex = { x: 400, y: 300 }

function transformAt(scale: number): ViewTransform {
  return { scale, offset: { x: 37, y: -12 } }
}

describe('isWithinScreenRadius', () => {
  it('detects a pointer within 15 CSS pixels as a snap target', () => {
    const transform = transformAt(1)
    const target = imageToScreen(firstVertex, transform)
    expect(isWithinScreenRadius({ x: target.x + 9, y: target.y + 12 }, firstVertex, transform, SNAP_RADIUS)).toBe(true)
    expect(isWithinScreenRadius({ x: target.x + 15, y: target.y }, firstVertex, transform, SNAP_RADIUS)).toBe(true)
  })

  it('does not snap to a pointer outside the radius', () => {
    const transform = transformAt(1)
    const target = imageToScreen(firstVertex, transform)
    expect(isWithinScreenRadius({ x: target.x + 12, y: target.y + 10 }, firstVertex, transform, SNAP_RADIUS)).toBe(false)
  })

  it.each([0.1, 0.5, 2, 8, 20])('uses the same screen-space radius at scale %s', (scale) => {
    const transform = transformAt(scale)
    const target = imageToScreen(firstVertex, transform)
    expect(isWithinScreenRadius({ x: target.x + 14.9, y: target.y }, firstVertex, transform, SNAP_RADIUS)).toBe(true)
    expect(isWithinScreenRadius({ x: target.x, y: target.y - 15.1 }, firstVertex, transform, SNAP_RADIUS)).toBe(false)
  })
})
