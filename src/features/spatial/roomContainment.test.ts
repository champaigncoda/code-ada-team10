import { describe, expect, it } from 'vitest'
import { outlineToFloorFootprint } from '../viewer/geometry/roomCoordinates'
import { L_SHAPE_PX, METERS_PER_PIXEL, RECTANGLE_PX } from '../viewer/testFixtures'
import { isPointInFloorPolygon } from '../furniture/placement/floorPlacement'
import type { PointXZ } from './footprint'
import { getFurnitureFootprint } from './footprint'
import {
  BOUNDARY_EPSILON,
  assessRoomPolygon,
  classifyFurnitureContainment,
  isFurnitureWithinRoom,
} from './roomContainment'
import type { FurnitureInstance } from '../../types/furniture'

const RECT = outlineToFloorFootprint(RECTANGLE_PX, METERS_PER_PIXEL)
const L_SHAPE = outlineToFloorFootprint(L_SHAPE_PX, METERS_PER_PIXEL)

function box(x: number, z: number, width: number, depth: number, rotationY = 0): PointXZ[] {
  const footprint = getFurnitureFootprint({
    id: 'piece',
    category: 'table',
    dimensions: { width, depth, height: 1 },
    color: '#ffffff',
    position: { x, z },
    rotationY,
  } satisfies FurnitureInstance)
  if (!footprint) throw new Error('expected a valid footprint')
  return footprint
}

describe('room polygon status', () => {
  it('accepts the calibrated rectangle and L and rejects degenerate outlines', () => {
    expect(assessRoomPolygon(RECT)).toBe('available')
    expect(assessRoomPolygon(L_SHAPE)).toBe('available')
    expect(assessRoomPolygon([
      { x: 0, z: 0 },
      { x: 1, z: 0 },
    ])).toBe('unavailable')
    expect(assessRoomPolygon([
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 2, z: 0 },
    ])).toBe('unavailable')
    expect(assessRoomPolygon([
      { x: 0, z: 0 },
      { x: Number.NaN, z: 1 },
      { x: 0, z: 1 },
    ])).toBe('unavailable')
    expect(assessRoomPolygon([
      { x: 0, z: 0 },
      { x: 0, z: 0 },
      { x: 0, z: BOUNDARY_EPSILON / 2 },
    ])).toBe('unavailable')
    // Bowtie: the diagonals cross.
    expect(assessRoomPolygon([
      { x: 0, z: 0 },
      { x: 1, z: 1 },
      { x: 0, z: 1 },
      { x: 1, z: 0 },
    ])).toBe('unavailable')
  })
})

describe('room containment', () => {
  it('accepts a rectangle fully inside the room', () => {
    expect(isFurnitureWithinRoom(box(0, 0, 1, 1), RECT)).toBe(true)
  })

  it('warns when the footprint is partly or entirely outside', () => {
    expect(classifyFurnitureContainment(box(1.8, 0, 1, 1), RECT)).toBe('outside')
    expect(classifyFurnitureContainment(box(6, 0, 1, 1), RECT)).toBe('outside')
  })

  it('allows exact wall contact and a collinear edge along the wall', () => {
    // Width 1 centered at x = 1.5 reaches exactly x = 2, the east wall.
    expect(classifyFurnitureContainment(box(1.5, 0, 1, 1), RECT)).toBe('inside')
    // Left edge sits on x = -2.
    expect(classifyFurnitureContainment(box(-1.5, 0, 1, 1), RECT)).toBe('inside')
  })

  it('ignores sub-millimetre noise and still reports a real protrusion', () => {
    expect(classifyFurnitureContainment(box(1.5 + BOUNDARY_EPSILON / 2, 0, 1, 1), RECT)).toBe('inside')
    expect(classifyFurnitureContainment(box(1.5 + 0.001, 0, 1, 1), RECT)).toBe('outside')
  })

  it('detects a rotated rectangle crossing the boundary', () => {
    expect(classifyFurnitureContainment(box(0, 0, 1, 1, Math.PI / 4), RECT)).toBe('inside')
    expect(classifyFurnitureContainment(box(1.8, 0, 1, 1, Math.PI / 4), RECT)).toBe('outside')
  })

  it('keeps a footprint inside an L when it only touches the concave vertex', () => {
    const footprint = box(-0.5, -0.5, 1, 1)
    expect(footprint.some((corner) => Math.abs(corner.x) < 1e-9 && Math.abs(corner.z) < 1e-9)).toBe(true)
    expect(classifyFurnitureContainment(footprint, L_SHAPE)).toBe('inside')
  })

  it('rejects an edge that crosses the excluded part of an L while every corner is inside', () => {
    const offset = 0.15 / Math.SQRT2
    const start = { x: 1.5, z: -0.5 }
    const end = { x: -0.5, z: 1.5 }
    const footprint: PointXZ[] = [
      start,
      end,
      { x: end.x + offset, z: end.z + offset },
      { x: start.x + offset, z: start.z + offset },
    ]
    for (const corner of footprint) {
      expect(isPointInFloorPolygon(corner, L_SHAPE)).toBe(true)
    }
    const midpoint = { x: (start.x + end.x) / 2, z: (start.z + end.z) / 2 }
    expect(isPointInFloorPolygon(midpoint, L_SHAPE)).toBe(false)
    expect(classifyFurnitureContainment(footprint, L_SHAPE)).toBe('outside')
    expect(isFurnitureWithinRoom(footprint, L_SHAPE)).toBe(false)
  })

  it('allows a diagonal that passes through the concave vertex without leaving the L', () => {
    const offset = 0.2 / Math.SQRT2
    const start = { x: 1, z: -1 }
    const end = { x: -1, z: 1 }
    const footprint: PointXZ[] = [
      start,
      end,
      { x: end.x - offset, z: end.z - offset },
      { x: start.x - offset, z: start.z - offset },
    ]
    expect(classifyFurnitureContainment(footprint, L_SHAPE)).toBe('inside')
  })

  it('reports validation unavailable instead of inside when the room polygon is invalid', () => {
    const bowtie: PointXZ[] = [
      { x: 0, z: 0 },
      { x: 1, z: 1 },
      { x: 0, z: 1 },
      { x: 1, z: 0 },
    ]
    expect(classifyFurnitureContainment(box(0.5, 0.5, 0.2, 0.2), bowtie)).toBe('unavailable')
    expect(isFurnitureWithinRoom(box(0, 0, 1, 1), bowtie)).toBe(false)
  })
})
