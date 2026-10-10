import { describe, expect, it } from 'vitest'
import type { Point2D } from '../types/geometry'
import { type PolygonIssueCode, validatePolygon } from './polygonValidation'

function issueCodes(vertices: readonly Point2D[]): PolygonIssueCode[] {
  const result = validatePolygon(vertices)
  return result.isValid ? [] : result.issues.map((issue) => issue.code)
}

describe('validatePolygon', () => {
  it('accepts a rectangle', () => {
    const rectangle = [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 300 },
      { x: 0, y: 300 },
    ]
    expect(validatePolygon(rectangle)).toEqual({ isValid: true })
  })

  it('accepts a concave six-vertex L-shape', () => {
    const lShape = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 300 },
      { x: 0, y: 300 },
    ]
    expect(validatePolygon(lShape)).toEqual({ isValid: true })
  })

  it('rejects a self-intersecting bow-tie', () => {
    const bowTie = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ]
    expect(issueCodes(bowTie)).toContain('SELF_INTERSECTION')
  })

  it('rejects duplicate adjacent vertices (zero-length edge)', () => {
    const withDuplicate = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]
    expect(issueCodes(withDuplicate)).toContain('DUPLICATE_ADJACENT_VERTICES')
  })

  it('rejects a duplicate between the last and first vertex (closing edge)', () => {
    const closingDuplicate = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 0 },
    ]
    expect(issueCodes(closingDuplicate)).toContain('DUPLICATE_ADJACENT_VERTICES')
  })

  it('rejects a polygon with only two vertices', () => {
    expect(issueCodes([{ x: 0, y: 0 }, { x: 100, y: 0 }])).toEqual(['TOO_FEW_VERTICES'])
  })

  it('rejects a polygon with zero enclosed area', () => {
    const collinear = [
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 100 },
    ]
    expect(issueCodes(collinear)).toContain('ZERO_AREA')
  })

  it('rejects a repeated nonadjacent vertex', () => {
    // Two triangles joined at (100, 100), which is visited twice.
    const figureEight = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 200, y: 0 },
      { x: 200, y: 200 },
      { x: 100, y: 100 },
      { x: 0, y: 200 },
    ]
    expect(issueCodes(figureEight)).toContain('REPEATED_VERTEX')
  })

  it('rejects overlapping nonadjacent edges', () => {
    // Edges 1–2 (x: 0→100 at y=0) and 5–6 (x: 80→20 at y=0) share a stretch of the same line.
    const overlapping = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: -50 },
      { x: 80, y: -50 },
      { x: 80, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 50 },
      { x: 0, y: 50 },
    ]
    expect(issueCodes(overlapping)).toContain('OVERLAPPING_EDGES')
  })

  it('rejects adjacent edges that fold back on themselves', () => {
    const spike = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 100 },
    ]
    expect(issueCodes(spike)).toContain('OVERLAPPING_EDGES')
  })

  it('rejects a vertex touching a nonadjacent edge', () => {
    const touching = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 50, y: 0 },
      { x: 0, y: 100 },
    ]
    expect(issueCodes(touching)).toContain('SELF_INTERSECTION')
  })

  it('accepts large real-world pixel coordinates', () => {
    const largeRectangle = [
      { x: 1234.5, y: 2345.25 },
      { x: 8765.75, y: 2345.25 },
      { x: 8765.75, y: 6543.5 },
      { x: 1234.5, y: 6543.5 },
    ]
    expect(validatePolygon(largeRectangle)).toEqual({ isValid: true })
  })

  it('does not modify the input vertices', () => {
    const vertices = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 0 },
    ]
    const copy = structuredClone(vertices)
    validatePolygon(vertices)
    expect(vertices).toEqual(copy)
  })
})
