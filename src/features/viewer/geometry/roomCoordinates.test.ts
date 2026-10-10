import { describe, expect, it } from 'vitest'
import { boundingBoxCenter } from '../../../geometry/polygon'
import { distance } from '../../../geometry/point'
import { L_SHAPE_PX, METERS_PER_PIXEL, RECTANGLE_PX, reverseOutline } from '../testFixtures'
import { floorBounds, imagePointToFloor, outlineToFloorFootprint } from './roomCoordinates'

describe('image-to-floor conversion', () => {
  it('converts a pixel through the documented formula', () => {
    const center = { x: 300, y: 250 }
    expect(imagePointToFloor({ x: 500, y: 100 }, center, METERS_PER_PIXEL)).toEqual({ x: 2, z: -1.5 })
  })

  it('preserves every edge length after conversion', () => {
    const footprint = outlineToFloorFootprint(RECTANGLE_PX, METERS_PER_PIXEL)
    RECTANGLE_PX.forEach((start, i) => {
      const end = RECTANGLE_PX[(i + 1) % RECTANGLE_PX.length]
      const a = footprint[i]
      const b = footprint[(i + 1) % footprint.length]
      expect(end && a && b).toBeTruthy()
      if (!end || !a || !b) return
      expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeCloseTo(distance(start, end) * METERS_PER_PIXEL, 12)
    })
  })

  it('preserves angles and proportions of a rectangle', () => {
    const footprint = outlineToFloorFootprint(RECTANGLE_PX, METERS_PER_PIXEL)
    const width = Math.hypot((footprint[1]?.x ?? 0) - (footprint[0]?.x ?? 0), (footprint[1]?.z ?? 0) - (footprint[0]?.z ?? 0))
    const height = Math.hypot((footprint[2]?.x ?? 0) - (footprint[1]?.x ?? 0), (footprint[2]?.z ?? 0) - (footprint[1]?.z ?? 0))
    expect(width / height).toBeCloseTo(400 / 300, 12)

    const top = { x: (footprint[1]?.x ?? 0) - (footprint[0]?.x ?? 0), z: (footprint[1]?.z ?? 0) - (footprint[0]?.z ?? 0) }
    const right = { x: (footprint[2]?.x ?? 0) - (footprint[1]?.x ?? 0), z: (footprint[2]?.z ?? 0) - (footprint[1]?.z ?? 0) }
    expect(top.x * right.x + top.z * right.z).toBeCloseTo(0, 12)
  })

  it('keeps the same centered bounds for clockwise and counterclockwise outlines', () => {
    const clockwise = outlineToFloorFootprint(RECTANGLE_PX, METERS_PER_PIXEL)
    const counterclockwise = outlineToFloorFootprint(reverseOutline(RECTANGLE_PX), METERS_PER_PIXEL)
    expect(floorBounds(clockwise)).toEqual(floorBounds(counterclockwise))
    expect(clockwise).toHaveLength(4)
    expect(counterclockwise).toHaveLength(4)
  })

  it('centers the footprint on the origin from the bounding-box center', () => {
    const center = boundingBoxCenter(L_SHAPE_PX)
    expect(center).toEqual({ x: 300, y: 300 })
    const footprint = outlineToFloorFootprint(L_SHAPE_PX, METERS_PER_PIXEL)
    const bounds = floorBounds(footprint)
    expect((bounds.minX + bounds.maxX) / 2).toBeCloseTo(0, 12)
    expect((bounds.minZ + bounds.maxZ) / 2).toBeCloseTo(0, 12)
    expect(imagePointToFloor(center, center, METERS_PER_PIXEL)).toEqual({ x: 0, z: 0 })
  })

  it('does not accept a canvas zoom or pan argument', () => {
    expect(outlineToFloorFootprint).toHaveLength(2)
    expect(imagePointToFloor).toHaveLength(3)
    expect(outlineToFloorFootprint(RECTANGLE_PX, METERS_PER_PIXEL)).toEqual([
      { x: -2, z: -1.5 },
      { x: 2, z: -1.5 },
      { x: 2, z: 1.5 },
      { x: -2, z: 1.5 },
    ])
  })
})
