import { describe, expect, it } from 'vitest'
import type { Point2D } from '../types/geometry'
import { findNearestEdge } from './edgeHitTest'
import { distanceToSegment } from './segment'
import {
  type ViewLayout,
  type ViewTransform,
  computeViewTransform,
  createFitCamera,
  imageToScreen,
  panCamera,
  zoomCameraAt,
} from './viewTransform'

const THRESHOLD = 10
const identity: ViewTransform = { scale: 1, offset: { x: 0, y: 0 } }

const rectangle: Point2D[] = [
  { x: 100, y: 100 },
  { x: 500, y: 100 },
  { x: 500, y: 400 },
  { x: 100, y: 400 },
]

function offsetPoint(p: Point2D, dx: number, dy: number): Point2D {
  return { x: p.x + dx, y: p.y + dy }
}

describe('distanceToSegment', () => {
  it('measures perpendicular distance within the segment and endpoint distance beyond it', () => {
    expect(distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(3)
    expect(distanceToSegment({ x: 13, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5)
    expect(distanceToSegment({ x: -6, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(6)
  })
})

describe('findNearestEdge', () => {
  it('selects the finite segment under the pointer', () => {
    expect(findNearestEdge({ x: 300, y: 106 }, rectangle, identity, THRESHOLD)).toBe(0)
    expect(findNearestEdge({ x: 493, y: 250 }, rectangle, identity, THRESHOLD)).toBe(1)
    expect(findNearestEdge({ x: 104, y: 250 }, rectangle, identity, THRESHOLD)).toBe(3)
    expect(findNearestEdge({ x: 300, y: 250 }, rectangle, identity, THRESHOLD)).toBeNull()
  })

  it('selects the correct edge after zooming and panning', () => {
    const layout: ViewLayout = { imageSize: { width: 1000, height: 800 }, viewportSize: { width: 800, height: 600 }, fitPadding: 24 }
    let camera = zoomCameraAt(createFitCamera(layout.imageSize), { x: 600, y: 200 }, 3.2, layout)
    camera = panCamera(camera, { x: -180, y: 95 }, layout)
    const transform = computeViewTransform(camera, layout)

    const edge1MidScreen = imageToScreen({ x: 500, y: 250 }, transform)
    expect(findNearestEdge(offsetPoint(edge1MidScreen, -7, 0), rectangle, transform, THRESHOLD)).toBe(1)

    const edge2MidScreen = imageToScreen({ x: 300, y: 400 }, transform)
    expect(findNearestEdge(offsetPoint(edge2MidScreen, 0, 8), rectangle, transform, THRESHOLD)).toBe(2)
    // The same image-space offset is far more than 10 px on screen at this zoom.
    expect(findNearestEdge(offsetPoint(edge2MidScreen, 0, 8 * transform.scale + 1), rectangle, transform, THRESHOLD)).toBeNull()
  })

  it.each([0.25, 0.5, 1, 3, 8])('uses a constant 10 CSS px tolerance at scale %s', (scale) => {
    const transform: ViewTransform = { scale, offset: { x: 40, y: -25 } }
    const edge0MidScreen = imageToScreen({ x: 300, y: 100 }, transform)
    expect(findNearestEdge(offsetPoint(edge0MidScreen, 0, -9.9), rectangle, transform, THRESHOLD)).toBe(0)
    expect(findNearestEdge(offsetPoint(edge0MidScreen, 0, -10.1), rectangle, transform, THRESHOLD)).toBeNull()
  })

  it('picks the nearest edge when several are within range, breaking exact ties by lowest index', () => {
    // Near the corner at (500, 100): 4 px from edge 0, 3 px from edge 1.
    expect(findNearestEdge({ x: 497, y: 104 }, rectangle, identity, THRESHOLD)).toBe(1)
    expect(findNearestEdge({ x: 496, y: 103 }, rectangle, identity, THRESHOLD)).toBe(0)
    // Exactly 3 px from both edges.
    expect(findNearestEdge({ x: 497, y: 103 }, rectangle, identity, THRESHOLD)).toBe(0)

    // A narrow corridor where two nonadjacent walls are 12 px apart.
    const corridor = [
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      { x: 300, y: 12 },
      { x: 0, y: 12 },
    ]
    expect(findNearestEdge({ x: 150, y: 4 }, corridor, identity, THRESHOLD)).toBe(0)
    expect(findNearestEdge({ x: 150, y: 8 }, corridor, identity, THRESHOLD)).toBe(2)
  })

  it('ignores points on the infinite supporting line beyond a segment end', () => {
    const triangle = [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
      { x: 200, y: 300 },
    ]
    // Collinear with edge 0 but 40 px past its end.
    expect(findNearestEdge({ x: 340, y: 100 }, triangle, identity, THRESHOLD)).toBeNull()
    expect(findNearestEdge({ x: 40, y: 100 }, triangle, identity, THRESHOLD)).toBeNull()
    // Just past the end, within 10 px of the endpoint, still counts.
    expect(findNearestEdge({ x: 306, y: 100 }, triangle, identity, THRESHOLD)).toBe(0)
  })
})
