import { describe, expect, it } from 'vitest'
import type { Point2D } from '../../types/geometry'
import { computeMetersPerPixel, computeWallLengthsMeters, formatMeters } from './scale'

const rectangle: Point2D[] = [
  { x: 0, y: 0 },
  { x: 400, y: 0 },
  { x: 400, y: 300 },
  { x: 0, y: 300 },
]

// 3-4-5 right triangle: edge 0 horizontal (300 px), edge 1 diagonal (500 px), edge 2 closing vertical (400 px).
const rightTriangle: Point2D[] = [
  { x: 0, y: 0 },
  { x: 300, y: 0 },
  { x: 0, y: 400 },
]

function expectLengthsClose(actual: number[] | null, expected: number[]): void {
  expect(actual).not.toBeNull()
  expect(actual).toHaveLength(expected.length)
  expected.forEach((value, i) => expect(actual?.[i]).toBeCloseTo(value, 10))
}

describe('computeMetersPerPixel', () => {
  it('derives the scale from a horizontal reference edge', () => {
    expect(computeMetersPerPixel(rectangle, { referenceEdgeIndex: 0, referenceLengthMeters: 4 })).toBe(0.01)
  })

  it('derives the scale from a vertical reference edge', () => {
    expect(computeMetersPerPixel(rectangle, { referenceEdgeIndex: 1, referenceLengthMeters: 6 })).toBe(0.02)
  })

  it.each([
    ['an index past the last edge', 4, 3],
    ['a negative index', -1, 3],
    ['a non-integer index', 0.5, 3],
    ['a zero length', 0, 0],
    ['a negative length', 0, -2],
    ['NaN', 0, Number.NaN],
    ['Infinity', 0, Number.POSITIVE_INFINITY],
  ])('returns null for %s', (_, referenceEdgeIndex, referenceLengthMeters) => {
    expect(computeMetersPerPixel(rectangle, { referenceEdgeIndex, referenceLengthMeters })).toBeNull()
  })

  it('returns null instead of dividing by a zero-length reference edge', () => {
    const degenerate = [
      { x: 10, y: 10 },
      { x: 10, y: 10 },
      { x: 50, y: 80 },
    ]
    expect(computeMetersPerPixel(degenerate, { referenceEdgeIndex: 0, referenceLengthMeters: 3 })).toBeNull()
    expect(computeWallLengthsMeters(degenerate, { referenceEdgeIndex: 0, referenceLengthMeters: 3 })).toBeNull()
  })
})

describe('computeWallLengthsMeters', () => {
  it('computes every wall of a rectangle with known dimensions', () => {
    // 5 m × 3.2 m room drawn at 80 px per meter.
    const room = [
      { x: 100, y: 100 },
      { x: 500, y: 100 },
      { x: 500, y: 356 },
      { x: 100, y: 356 },
    ]
    expectLengthsClose(computeWallLengthsMeters(room, { referenceEdgeIndex: 0, referenceLengthMeters: 5 }), [5, 3.2, 5, 3.2])
  })

  it('computes every wall of a concave L-shaped room', () => {
    const lShape = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 300 },
      { x: 0, y: 300 },
    ]
    expectLengthsClose(computeWallLengthsMeters(lShape, { referenceEdgeIndex: 0, referenceLengthMeters: 6 }), [6, 3, 3, 6, 3, 9])
  })

  it('computes diagonal walls, including from a diagonal reference', () => {
    expectLengthsClose(computeWallLengthsMeters(rightTriangle, { referenceEdgeIndex: 0, referenceLengthMeters: 3 }), [3, 5, 4])
    expectLengthsClose(computeWallLengthsMeters(rightTriangle, { referenceEdgeIndex: 1, referenceLengthMeters: 10 }), [6, 10, 8])
  })

  it('computes the closing edge from the last vertex back to the first', () => {
    const lengths = computeWallLengthsMeters(rightTriangle, { referenceEdgeIndex: 0, referenceLengthMeters: 3 })
    expect(lengths?.[2]).toBeCloseTo(4, 12)
    expectLengthsClose(computeWallLengthsMeters(rightTriangle, { referenceEdgeIndex: 2, referenceLengthMeters: 8 }), [6, 10, 8])
  })

  it('recalculates all walls when the reference length changes', () => {
    const before = computeWallLengthsMeters(rectangle, { referenceEdgeIndex: 0, referenceLengthMeters: 4 })
    const after = computeWallLengthsMeters(rectangle, { referenceEdgeIndex: 0, referenceLengthMeters: 6 })
    expectLengthsClose(before, [4, 3, 4, 3])
    expectLengthsClose(after, [6, 4.5, 6, 4.5])
  })

  it('recalculates all walls when a different reference edge is chosen', () => {
    expectLengthsClose(computeWallLengthsMeters(rectangle, { referenceEdgeIndex: 1, referenceLengthMeters: 6 }), [8, 6, 8, 6])
    expectLengthsClose(computeWallLengthsMeters(rectangle, { referenceEdgeIndex: 3, referenceLengthMeters: 1.5 }), [2, 1.5, 2, 1.5])
  })

  it('keeps full floating-point precision rather than rounded values', () => {
    const thin = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 0, y: 1 },
    ]
    const lengths = computeWallLengthsMeters(thin, { referenceEdgeIndex: 0, referenceLengthMeters: 1 })
    expect(lengths?.[1]).toBe(1 / 3)
    expect(formatMeters(lengths?.[1] ?? 0)).toBe('0.33 m')

    const irregular = [
      { x: 12.345, y: 67.891 },
      { x: 811.112, y: 70.004 },
      { x: 799.5, y: 655.25 },
    ]
    const precise = computeWallLengthsMeters(irregular, { referenceEdgeIndex: 0, referenceLengthMeters: 3.756 })
    const pixel0 = Math.hypot(811.112 - 12.345, 70.004 - 67.891)
    const pixel1 = Math.hypot(799.5 - 811.112, 655.25 - 70.004)
    expect(precise?.[0]).toBe(pixel0 * (3.756 / pixel0))
    expect(precise?.[1]).toBe(pixel1 * (3.756 / pixel0))
  })

  it('never modifies the polygon vertices', () => {
    const vertices = structuredClone(rectangle)
    const frozen = Object.freeze(vertices.map((v) => Object.freeze({ ...v })))
    computeWallLengthsMeters(frozen, { referenceEdgeIndex: 2, referenceLengthMeters: 7.25 })
    expect(frozen).toEqual(rectangle)
  })
})

describe('formatMeters', () => {
  it('rounds to two decimals for display', () => {
    expect(formatMeters(3.75)).toBe('3.75 m')
    expect(formatMeters(3)).toBe('3.00 m')
    expect(formatMeters(2.345678)).toBe('2.35 m')
  })
})
