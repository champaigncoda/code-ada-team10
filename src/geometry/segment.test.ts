import { describe, expect, it } from 'vitest'
import { classifySegmentIntersection } from './segment'

const p = (x: number, y: number) => ({ x, y })

describe('classifySegmentIntersection', () => {
  it('detects an ordinary crossing', () => {
    expect(classifySegmentIntersection(p(0, 0), p(10, 10), p(0, 10), p(10, 0))).toBe('cross')
  })

  it('detects a shared endpoint as a touch', () => {
    expect(classifySegmentIntersection(p(0, 0), p(10, 0), p(10, 0), p(10, 10))).toBe('touch')
  })

  it('detects an endpoint lying on the other segment as a touch', () => {
    expect(classifySegmentIntersection(p(0, 0), p(10, 0), p(5, 0), p(5, 10))).toBe('touch')
  })

  it('detects collinear overlap', () => {
    expect(classifySegmentIntersection(p(0, 0), p(10, 0), p(5, 0), p(15, 0))).toBe('overlap')
  })

  it('treats collinear segments meeting end-to-end as a touch', () => {
    expect(classifySegmentIntersection(p(0, 0), p(10, 0), p(10, 0), p(20, 0))).toBe('touch')
  })

  it('reports no intersection for disjoint collinear segments', () => {
    expect(classifySegmentIntersection(p(0, 0), p(10, 0), p(11, 0), p(20, 0))).toBe('none')
  })

  it('reports no intersection for parallel segments', () => {
    expect(classifySegmentIntersection(p(0, 0), p(10, 0), p(0, 1), p(10, 1))).toBe('none')
  })
})
