import { describe, expect, it } from 'vitest'
import { isPointInPolygon, signedArea } from '../../../geometry/polygon'
import { L_SHAPE_PX, RECTANGLE_PX, reverseOutline, roomSource } from '../testFixtures'
import { triangleNormalY } from './floorTriangulation'
import { floorPointsAsPlanar } from './roomCoordinates'
import { buildRoomGeometry } from './roomGeometry'

function triangleArea(geometry: NonNullable<ReturnType<typeof buildRoomGeometry>>, triangle: readonly [number, number, number]): number {
  const [i, j, k] = triangle
  const a = geometry.footprint[i]
  const b = geometry.footprint[j]
  const c = geometry.footprint[k]
  if (!a || !b || !c) return 0
  return Math.abs(triangleNormalY(a, b, c)) / 2
}

function centroid(geometry: NonNullable<ReturnType<typeof buildRoomGeometry>>, triangle: readonly [number, number, number]) {
  const [i, j, k] = triangle
  const a = geometry.footprint[i]
  const b = geometry.footprint[j]
  const c = geometry.footprint[k]
  if (!a || !b || !c) return { x: 0, z: 0 }
  return { x: (a.x + b.x + c.x) / 3, z: (a.z + b.z + c.z) / 3 }
}

describe('floor geometry', () => {
  it('matches the rectangular footprint exactly', () => {
    const room = buildRoomGeometry(roomSource(RECTANGLE_PX))
    expect(room?.footprint).toEqual([
      { x: -2, z: -1.5 },
      { x: 2, z: -1.5 },
      { x: 2, z: 1.5 },
      { x: -2, z: 1.5 },
    ])
    expect(room?.bounds).toMatchObject({ width: 4, depth: 3, minX: -2, maxX: 2, minZ: -1.5, maxZ: 1.5 })
  })

  it('matches the L-shaped footprint, including the inner corner', () => {
    const room = buildRoomGeometry(roomSource(L_SHAPE_PX))
    expect(room?.footprint).toEqual([
      { x: -2, z: -2 },
      { x: 2, z: -2 },
      { x: 2, z: 0 },
      { x: 0, z: 0 },
      { x: 0, z: 2 },
      { x: -2, z: 2 },
    ])
    expect(room?.footprint).toContainEqual({ x: 0, z: 0 })
  })

  it('triangulates a concave L-shape without using the bounding rectangle', () => {
    const room = buildRoomGeometry(roomSource(L_SHAPE_PX))
    expect(room).toBeTruthy()
    if (!room) return
    expect(room.floorTriangles.length).toBeGreaterThanOrEqual(4)
    const notch = { x: 1, z: 1 }
    const planar = floorPointsAsPlanar(room.footprint)
    expect(isPointInPolygon({ x: notch.x, y: notch.z }, planar)).toBe(false)
    for (const triangle of room.floorTriangles) {
      const mid = centroid(room, triangle)
      expect(isPointInPolygon({ x: mid.x, y: mid.z }, planar)).toBe(true)
    }
  })

  it('computes the known floor area of the rectangle and the L-shape', () => {
    const rectangle = buildRoomGeometry(roomSource(RECTANGLE_PX))
    const lShape = buildRoomGeometry(roomSource(L_SHAPE_PX))
    expect(rectangle?.floorAreaSquareMeters).toBeCloseTo(12, 12)
    expect(lShape?.floorAreaSquareMeters).toBeCloseTo(12, 12)
    expect(rectangle && rectangle.floorTriangles.reduce((sum, triangle) => sum + triangleArea(rectangle, triangle), 0)).toBeCloseTo(12, 10)
    expect(lShape && lShape.floorTriangles.reduce((sum, triangle) => sum + triangleArea(lShape, triangle), 0)).toBeCloseTo(12, 10)
  })

  it('keeps every triangle inside the intended polygon', () => {
    const room = buildRoomGeometry(roomSource(L_SHAPE_PX))
    expect(room).toBeTruthy()
    if (!room) return
    const planar = floorPointsAsPlanar(room.footprint)
    for (const [i, j, k] of room.floorTriangles) {
      for (const index of [i, j, k]) {
        expect(room.footprint[index ?? -1]).toBeTruthy()
      }
      const mid = centroid(room, [i ?? 0, j ?? 0, k ?? 0])
      expect(isPointInPolygon({ x: mid.x, y: mid.z }, planar)).toBe(true)
    }
    const outside = [
      { x: 1, z: 1 },
      { x: 3, z: 0 },
      { x: 0, z: 3 },
    ]
    for (const point of outside) {
      expect(isPointInPolygon({ x: point.x, y: point.z }, planar)).toBe(false)
    }
  })

  it('faces both winding orders upward and keeps the same area', () => {
    const clockwise = buildRoomGeometry(roomSource(RECTANGLE_PX))
    const counterclockwise = buildRoomGeometry(roomSource(reverseOutline(RECTANGLE_PX)))
    expect(clockwise && counterclockwise).toBeTruthy()
    if (!clockwise || !counterclockwise) return
    expect(Math.sign(signedArea(RECTANGLE_PX))).not.toBe(Math.sign(signedArea(reverseOutline(RECTANGLE_PX))))
    expect(clockwise.floorAreaSquareMeters).toBeCloseTo(counterclockwise.floorAreaSquareMeters, 12)
    for (const room of [clockwise, counterclockwise]) {
      for (const [i, j, k] of room.floorTriangles) {
        const a = room.footprint[i ?? 0]
        const b = room.footprint[j ?? 0]
        const c = room.footprint[k ?? 0]
        expect(a && b && c && triangleNormalY(a, b, c)).toBeGreaterThan(0)
      }
    }
  })
})
