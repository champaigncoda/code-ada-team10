import { describe, expect, it } from 'vitest'
import { outlineToFloorFootprint } from '../../viewer/geometry/roomCoordinates'
import { L_SHAPE_PX, METERS_PER_PIXEL, RECTANGLE_PX } from '../../viewer/testFixtures'
import { isPointInFloorPolygon, rayHitFloorY0 } from './floorPlacement'
import type { FloorPoint } from '../../../types/room'

const RECT = outlineToFloorFootprint(RECTANGLE_PX, METERS_PER_PIXEL)
const L_SHAPE = outlineToFloorFootprint(L_SHAPE_PX, METERS_PER_PIXEL)

function hit(origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }): FloorPoint | null {
  return rayHitFloorY0(origin, direction)
}

describe('floor ray intersection', () => {
  it('hits Y = 0 in world meters', () => {
    expect(hit({ x: 1.5, y: 4, z: -2 }, { x: 0, y: -1, z: 0 })).toEqual({ x: 1.5, z: -2 })
  })

  it('returns the same floor point for different camera rays', () => {
    const fromAbove = hit({ x: 0, y: 8, z: 0 }, { x: 0, y: -1, z: 0 })
    const fromCorner = hit({ x: 4, y: 4, z: 0 }, { x: -1, y: -1, z: 0 })
    const fromSide = hit({ x: 0, y: 4, z: 6 }, { x: 0, y: -1, z: -1.5 })
    expect(fromAbove).toEqual({ x: 0, z: 0 })
    expect(fromCorner).toEqual({ x: 0, z: 0 })
    expect(fromSide).toEqual({ x: 0, z: 0 })
  })

  it('rejects rays that miss the floor', () => {
    expect(hit({ x: 0, y: 2, z: 0 }, { x: 1, y: 0, z: 0 })).toBeNull()
    expect(hit({ x: 0, y: -1, z: 0 }, { x: 0, y: -1, z: 0 })).toBeNull()
    expect(hit({ x: 0, y: Number.NaN, z: 0 }, { x: 0, y: -1, z: 0 })).toBeNull()
  })
})

describe('floor polygon containment', () => {
  it('accepts the interior and boundary of a rectangular room and rejects the outside', () => {
    expect(isPointInFloorPolygon({ x: 0, z: 0 }, RECT)).toBe(true)
    expect(isPointInFloorPolygon({ x: RECT[0]!.x, z: RECT[0]!.z }, RECT)).toBe(true)
    const edgeMid = { x: (RECT[0]!.x + RECT[1]!.x) / 2, z: (RECT[0]!.z + RECT[1]!.z) / 2 }
    expect(isPointInFloorPolygon(edgeMid, RECT)).toBe(true)
    expect(isPointInFloorPolygon({ x: 50, z: 0 }, RECT)).toBe(false)
  })

  it('follows a concave L-shaped footprint instead of its bounding box', () => {
    const insideArm = imageToFloor(200, 400)
    const insideOtherArm = imageToFloor(400, 200)
    const notch = imageToFloor(400, 400)
    expect(isPointInFloorPolygon(insideArm, L_SHAPE)).toBe(true)
    expect(isPointInFloorPolygon(insideOtherArm, L_SHAPE)).toBe(true)
    expect(isPointInFloorPolygon(notch, L_SHAPE)).toBe(false)
  })

  it('keeps a point just outside an edge outside the room', () => {
    const [first] = RECT
    expect(first).toBeTruthy()
    if (!first) return
    expect(isPointInFloorPolygon({ x: first.x - 0.05, z: 0 }, RECT)).toBe(false)
  })
})

function imageToFloor(px: number, py: number): FloorPoint {
  const center = { x: 300, y: 300 }
  return { x: (px - center.x) * METERS_PER_PIXEL, z: (py - center.y) * METERS_PER_PIXEL }
}
