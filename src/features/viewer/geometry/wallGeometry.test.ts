import { describe, expect, it } from 'vitest'
import { DIAGONAL_ROOM_PX, L_SHAPE_PX, RECTANGLE_PX, roomSource } from '../testFixtures'
import { outlineToFloorFootprint } from './roomCoordinates'
import { buildRoomGeometry } from './roomGeometry'
import { METERS_PER_PIXEL } from '../testFixtures'

describe('wall geometry', () => {
  it('creates one wall per edge, including the closing edge', () => {
    expect(buildRoomGeometry(roomSource(RECTANGLE_PX))?.walls).toHaveLength(4)
    expect(buildRoomGeometry(roomSource(L_SHAPE_PX))?.walls).toHaveLength(6)
  })

  it('matches the known lengths of a 4 m × 3 m rectangle', () => {
    const walls = buildRoomGeometry(roomSource(RECTANGLE_PX, 2.8))?.walls ?? []
    expect(walls.map((wall) => wall.lengthMeters)).toEqual([4, 3, 4, 3])
  })

  it('uses the unrounded room height on every wall', () => {
    const height = 2.8125
    const walls = buildRoomGeometry(roomSource(RECTANGLE_PX, height))?.walls ?? []
    expect(walls.every((wall) => wall.heightMeters === height)).toBe(true)
  })

  it('places each wall on the converted polygon edge', () => {
    const footprint = outlineToFloorFootprint(RECTANGLE_PX, METERS_PER_PIXEL)
    const walls = buildRoomGeometry(roomSource(RECTANGLE_PX))?.walls ?? []
    walls.forEach((wall, i) => {
      expect(wall.start).toEqual(footprint[i])
      expect(wall.end).toEqual(footprint[(i + 1) % footprint.length])
      expect(wall.index).toBe(i)
    })
  })

  it('orients a diagonal wall along its exact segment', () => {
    const walls = buildRoomGeometry(roomSource(DIAGONAL_ROOM_PX))?.walls ?? []
    const diagonal = walls[0]
    expect(diagonal).toBeTruthy()
    if (!diagonal) return
    expect(diagonal.start).toEqual({ x: -1.5, z: -0.5 })
    expect(diagonal.end).toEqual({ x: 1.5, z: -1.5 })
    expect(diagonal.lengthMeters).toBeCloseTo(Math.hypot(3, 1), 12)
    const along = { x: diagonal.end.x - diagonal.start.x, z: diagonal.end.z - diagonal.start.z }
    expect(diagonal.inwardNormal.x * along.x + diagonal.inwardNormal.z * along.z).toBeCloseTo(0, 12)
  })

  it('connects adjacent walls at shared vertices', () => {
    const walls = buildRoomGeometry(roomSource(L_SHAPE_PX))?.walls ?? []
    walls.forEach((wall, i) => {
      const next = walls[(i + 1) % walls.length]
      expect(next).toBeTruthy()
      if (!next) return
      expect(wall.end).toEqual(next.start)
    })
    expect(walls[0]?.start).toEqual(walls.at(-1)?.end)
  })

  it('keeps L-shape wall lengths consistent with the calibrated edges', () => {
    const walls = buildRoomGeometry(roomSource(L_SHAPE_PX))?.walls ?? []
    expect(walls.map((wall) => wall.lengthMeters)).toEqual([4, 2, 2, 2, 2, 4])
  })
})
