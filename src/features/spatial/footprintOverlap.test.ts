import { describe, expect, it } from 'vitest'
import type { FurnitureInstance } from '../../types/furniture'
import { getFurnitureFootprint, rotateXZ, type PointXZ } from './footprint'
import { OVERLAP_EPSILON, doFurnitureFootprintsOverlap, projectionOverlapDepth } from './footprintOverlap'

function corners(x: number, z: number, width: number, depth: number, rotationY = 0): PointXZ[] {
  const footprint = getFurnitureFootprint({
    id: 'piece',
    category: 'sofa',
    dimensions: { width, depth, height: 1 },
    color: '#ffffff',
    position: { x, z },
    rotationY,
  } satisfies FurnitureInstance)
  if (!footprint) throw new Error('expected a valid footprint')
  return footprint
}

function boundsOverlap(a: readonly PointXZ[], b: readonly PointXZ[]): boolean {
  const box = (points: readonly PointXZ[]) => ({
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minZ: Math.min(...points.map((point) => point.z)),
    maxZ: Math.max(...points.map((point) => point.z)),
  })
  const left = box(a)
  const right = box(b)
  const overlapX = projectionOverlapDepth({ min: left.minX, max: left.maxX }, { min: right.minX, max: right.maxX })
  const overlapZ = projectionOverlapDepth({ min: left.minZ, max: left.maxZ }, { min: right.minZ, max: right.maxZ })
  return overlapX > OVERLAP_EPSILON && overlapZ > OVERLAP_EPSILON
}

describe('rotated rectangle overlap', () => {
  it('treats a gap, shared edge, and shared corner as contact', () => {
    const origin = corners(0, 0, 1, 1)
    expect(doFurnitureFootprintsOverlap(origin, corners(2, 0, 1, 1))).toBe(false)
    expect(doFurnitureFootprintsOverlap(origin, corners(1, 0, 1, 1))).toBe(false)
    expect(doFurnitureFootprintsOverlap(origin, corners(1, 1, 1, 1))).toBe(false)
  })

  it('ignores penetration within 5 mm and reports penetration past it', () => {
    const origin = corners(0, 0, 1, 1)
    expect(doFurnitureFootprintsOverlap(origin, corners(1 - 0.004, 0, 1, 1))).toBe(false)
    expect(doFurnitureFootprintsOverlap(origin, corners(1 - 0.006, 0, 1, 1))).toBe(true)
    expect(projectionOverlapDepth({ min: 0, max: 1 }, { min: 0.995, max: 2 })).toBeCloseTo(0.005, 10)
    expect(0.005 <= OVERLAP_EPSILON).toBe(true)
  })

  it('reports partial overlap, full containment, and identical footprints', () => {
    expect(doFurnitureFootprintsOverlap(corners(0, 0, 1, 1), corners(0.4, 0, 1, 1))).toBe(true)
    expect(doFurnitureFootprintsOverlap(corners(0, 0, 2, 2), corners(0.2, 0.1, 0.4, 0.4))).toBe(true)
    expect(doFurnitureFootprintsOverlap(corners(1, -2, 1.5, 0.8), corners(1, -2, 1.5, 0.8))).toBe(true)
  })

  it('reports rotated rectangles that cross and rejects a rotated pair that only shares an edge', () => {
    expect(doFurnitureFootprintsOverlap(corners(0, 0, 1, 0.4, Math.PI / 4), corners(0, 0, 0.4, 1, Math.PI / 4))).toBe(true)
    const rotation = Math.PI / 6
    const contact = rotateXZ(1, 0, rotation)
    expect(doFurnitureFootprintsOverlap(corners(0, 0, 1, 1, rotation), corners(contact.x, contact.z, 1, 1, rotation))).toBe(false)
    const penetrating = rotateXZ(1 - 0.02, 0, rotation)
    expect(doFurnitureFootprintsOverlap(corners(0, 0, 1, 1, rotation), corners(penetrating.x, penetrating.z, 1, 1, rotation))).toBe(true)
  })

  it('does not treat overlapping axis-aligned bounds as a rotated overlap', () => {
    const horizontal = corners(0, 0, 2, 2)
    // Thin bar along x + z = 3.2. Its bounds cover the square's corner, but the bar misses it.
    const bar = corners(1.6, 1.6, 3, 0.1, Math.PI / 4)
    expect(boundsOverlap(horizontal, bar)).toBe(true)
    expect(doFurnitureFootprintsOverlap(horizontal, bar)).toBe(false)
  })

  it('returns false for malformed footprints without throwing', () => {
    const valid = corners(0, 0, 1, 1)
    expect(doFurnitureFootprintsOverlap(valid, [])).toBe(false)
    expect(doFurnitureFootprintsOverlap(valid, [{ x: Number.NaN, z: 0 }, { x: 1, z: 0 }, { x: 1, z: 1 }, { x: 0, z: 1 }])).toBe(false)
  })
})
