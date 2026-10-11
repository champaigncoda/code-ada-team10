import { describe, expect, it } from 'vitest'
import { Object3D, Vector3 } from 'three'
import type { FurnitureInstance } from '../../types/furniture'
import { getFurnitureFootprint, rotateXZ } from './footprint'

function item(overrides: Partial<FurnitureInstance> = {}): FurnitureInstance {
  return {
    id: 'sofa-1',
    category: 'sofa',
    dimensions: { width: 2, depth: 1, height: 0.8 },
    color: '#d4c4a8',
    position: { x: 0, z: 0 },
    rotationY: 0,
    ...overrides,
  }
}

describe('furniture footprint', () => {
  it('places an unrotated rectangle around the bottom center', () => {
    expect(getFurnitureFootprint(item())).toEqual([
      { x: -1, z: -0.5 },
      { x: 1, z: -0.5 },
      { x: 1, z: 0.5 },
      { x: -1, z: 0.5 },
    ])
  })

  it('maps width to X and depth to Z, and ignores height', () => {
    const short = getFurnitureFootprint(item({ dimensions: { width: 2, depth: 1, height: 0.2 } }))
    const tall = getFurnitureFootprint(item({ dimensions: { width: 2, depth: 1, height: 3 } }))
    expect(tall).toEqual(short)

    const wide = getFurnitureFootprint(item({ dimensions: { width: 4, depth: 0.5, height: 1 } }))
    expect(wide?.[1]).toEqual({ x: 2, z: -0.25 })
    expect(wide?.[2]).toEqual({ x: 2, z: 0.25 })
  })

  it('translates in X and Z without changing size', () => {
    const footprint = getFurnitureFootprint(item({ position: { x: 3, z: -4 } }))
    expect(footprint).toEqual([
      { x: 2, z: -4.5 },
      { x: 4, z: -4.5 },
      { x: 4, z: -3.5 },
      { x: 2, z: -3.5 },
    ])
  })

  it('matches Three.js positive Y rotation for every corner', () => {
    const rotationY = 0.7
    const position = { x: 3, z: -4 }
    const object = new Object3D()
    object.rotation.y = rotationY
    object.position.set(position.x, 0, position.z)
    object.updateMatrixWorld()

    const footprint = getFurnitureFootprint(item({ position, rotationY }))
    const localCorners = [
      [-1, -0.5],
      [1, -0.5],
      [1, 0.5],
      [-1, 0.5],
    ]
    localCorners.forEach(([x, z], index) => {
      const world = new Vector3(x, 0, z).applyMatrix4(object.matrixWorld)
      expect(footprint?.[index]?.x).toBeCloseTo(world.x, 8)
      expect(footprint?.[index]?.z).toBeCloseTo(world.z, 8)
    })
  })

  it('turns local +X toward world −Z at 90 degrees', () => {
    expect(rotateXZ(1, 0, Math.PI / 2).x).toBeCloseTo(0, 10)
    expect(rotateXZ(1, 0, Math.PI / 2).z).toBeCloseTo(-1, 10)
    const footprint = getFurnitureFootprint(item({ rotationY: Math.PI / 2 }))
    expect(footprint?.[1]?.x).toBeCloseTo(-0.5, 8)
    expect(footprint?.[1]?.z).toBeCloseTo(-1, 8)
    expect(footprint?.[2]?.x).toBeCloseTo(0.5, 8)
    expect(footprint?.[2]?.z).toBeCloseTo(-1, 8)
  })

  it('accepts negative rotation and a full extra turn', () => {
    const negative = getFurnitureFootprint(item({ rotationY: -Math.PI / 2 }))
    const positive = getFurnitureFootprint(item({ rotationY: (3 * Math.PI) / 2 }))
    expect(negative?.[0]?.x).toBeCloseTo(positive?.[0]?.x ?? NaN, 8)
    expect(negative?.[0]?.z).toBeCloseTo(positive?.[0]?.z ?? NaN, 8)
    expect(negative?.[1]?.z).toBeCloseTo(1, 8)
  })

  it('uses the same corners for sofa, bed, and table', () => {
    const dimensions = { width: 1.2, depth: 0.7, height: 0.75 }
    const sofa = getFurnitureFootprint(item({ category: 'sofa', dimensions }))
    const bed = getFurnitureFootprint(item({ category: 'bed', dimensions }))
    const table = getFurnitureFootprint(item({ category: 'table', dimensions }))
    expect(bed).toEqual(sofa)
    expect(table).toEqual(sofa)
  })

  it('returns null for invalid dimensions or transforms and does not mutate the instance', () => {
    const original = item()
    const snapshot = {
      ...original,
      dimensions: { ...original.dimensions },
      position: { ...original.position },
    }
    expect(getFurnitureFootprint(original)).not.toBeNull()
    expect(original).toEqual(snapshot)

    expect(getFurnitureFootprint(item({ dimensions: { width: 0, depth: 1, height: 1 } }))).toBeNull()
    expect(getFurnitureFootprint(item({ dimensions: { width: -1, depth: 1, height: 1 } }))).toBeNull()
    expect(getFurnitureFootprint(item({ dimensions: { width: Number.NaN, depth: 1, height: 1 } }))).toBeNull()
    expect(getFurnitureFootprint(item({ dimensions: { width: Number.POSITIVE_INFINITY, depth: 1, height: 1 } }))).toBeNull()
    expect(getFurnitureFootprint(item({ position: { x: Number.NaN, z: 0 } }))).toBeNull()
    expect(getFurnitureFootprint(item({ position: { x: 0, z: Number.POSITIVE_INFINITY } }))).toBeNull()
    expect(getFurnitureFootprint(item({ rotationY: Number.NaN }))).toBeNull()
  })
})
