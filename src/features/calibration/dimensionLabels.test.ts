import { describe, expect, it } from 'vitest'
import { distance } from '../../geometry/point'
import {
  type ViewLayout,
  type ViewTransform,
  computeViewTransform,
  createFitCamera,
  imageToScreen,
  panCamera,
  zoomCameraAt,
} from '../../geometry/viewTransform'
import type { Point2D } from '../../types/geometry'
import { DIMENSION_LABEL_OFFSET_PX } from './constants'
import { type DimensionLabel, layoutDimensionLabels } from './dimensionLabels'
import { computeWallLengthsMeters } from './scale'

const lShape: Point2D[] = [
  { x: 100, y: 100 },
  { x: 500, y: 100 },
  { x: 500, y: 300 },
  { x: 300, y: 300 },
  { x: 300, y: 600 },
  { x: 100, y: 600 },
]
const imageSize = { width: 800, height: 700 }
const calibration = { referenceEdgeIndex: 0, referenceLengthMeters: 6 }
const wallLengthsMeters = computeWallLengthsMeters(lShape, calibration) ?? []

function layoutAt(camera: Parameters<typeof computeViewTransform>[0], viewportSize: ViewLayout['viewportSize']) {
  const layout: ViewLayout = { imageSize, viewportSize, fitPadding: 24 }
  const transform = computeViewTransform(camera, layout)
  return {
    transform,
    labels: layoutDimensionLabels({ vertices: lShape, wallLengthsMeters, referenceEdgeIndex: 0, transform, viewportSize }),
  }
}

function edgeMidpointScreen(edgeIndex: number, transform: ViewTransform): Point2D {
  const start = lShape[edgeIndex]
  const end = lShape[(edgeIndex + 1) % lShape.length]
  if (!start || !end) throw new Error('bad edge')
  return imageToScreen({ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, transform)
}

function byEdge(labels: DimensionLabel[]): Map<number, DimensionLabel> {
  return new Map(labels.map((label) => [label.edgeIndex, label]))
}

const fitView = { camera: createFitCamera(imageSize), viewport: { width: 900, height: 700 } }
const fitLayout: ViewLayout = { imageSize, viewportSize: fitView.viewport, fitPadding: 24 }
const zoomedCamera = zoomCameraAt(fitView.camera, { x: 300, y: 260 }, 1.8, fitLayout)
const views = [
  { name: 'fit', camera: fitView.camera, viewport: fitView.viewport },
  { name: 'zoomed', camera: zoomedCamera, viewport: fitView.viewport },
  { name: 'zoomed and panned', camera: panCamera(zoomedCamera, { x: 60, y: -40 }, fitLayout), viewport: fitView.viewport },
  { name: 'resized', camera: fitView.camera, viewport: { width: 640, height: 900 } },
]

describe('layoutDimensionLabels', () => {
  it('formats each wall in meters and flags the reference wall', () => {
    const { labels } = layoutAt(fitView.camera, fitView.viewport)
    expect(labels.map((l) => l.text)).toEqual(['6.00 m', '3.00 m', '3.00 m', '4.50 m', '3.00 m', '7.50 m'])
    expect(labels.filter((l) => l.isReference).map((l) => l.edgeIndex)).toEqual([0])
  })

  it.each(views)('keeps wall lengths unchanged when the view is $name', ({ camera, viewport }) => {
    const { labels } = layoutAt(camera, viewport)
    const reference = byEdge(layoutAt(fitView.camera, fitView.viewport).labels)
    for (const label of labels) {
      expect(label.text).toBe(reference.get(label.edgeIndex)?.text)
    }
  })

  it.each(views)('places each label a fixed screen distance outside its own edge midpoint when $name', ({ camera, viewport }) => {
    const { labels, transform } = layoutAt(camera, viewport)
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      const midpoint = edgeMidpointScreen(label.edgeIndex, transform)
      const isClamped =
        label.screen.x <= 60 || label.screen.y <= 20 || label.screen.x >= viewport.width - 60 || label.screen.y >= viewport.height - 20
      if (!isClamped) {
        expect(distance(label.screen, midpoint)).toBeCloseTo(DIMENSION_LABEL_OFFSET_PX, 9)
      }
      // The label is closer to its own edge midpoint than to any other edge's midpoint.
      lShape.forEach((_, other) => {
        if (other !== label.edgeIndex) {
          expect(distance(label.screen, midpoint)).toBeLessThan(distance(label.screen, edgeMidpointScreen(other, transform)))
        }
      })
    }
  })

  it('pushes labels outside the room', () => {
    const { labels, transform } = layoutAt(fitView.camera, fitView.viewport)
    const edges = byEdge(labels)
    const top = edges.get(0)
    const left = edges.get(5)
    expect(top && top.screen.y).toBeLessThan(edgeMidpointScreen(0, transform).y)
    expect(left && left.screen.x).toBeLessThan(edgeMidpointScreen(5, transform).x)
    // Edge 2 (inner horizontal wall of the L) faces down-right into empty space.
    const inner = edges.get(2)
    expect(inner && inner.screen.y).toBeGreaterThan(edgeMidpointScreen(2, transform).y)
  })

  it('omits walls whose midpoint is off-screen and clamps the rest inside the canvas', () => {
    const layout: ViewLayout = { imageSize, viewportSize: fitView.viewport, fitPadding: 24 }
    const camera = zoomCameraAt(fitView.camera, edgeMidpointScreen(0, computeViewTransform(fitView.camera, layout)), 6, layout)
    const { labels } = layoutAt(camera, fitView.viewport)
    expect(labels.map((l) => l.edgeIndex)).toEqual([0])
    for (const label of labels) {
      expect(label.screen.x).toBeGreaterThanOrEqual(0)
      expect(label.screen.y).toBeGreaterThanOrEqual(0)
      expect(label.screen.x).toBeLessThanOrEqual(fitView.viewport.width)
      expect(label.screen.y).toBeLessThanOrEqual(fitView.viewport.height)
    }
  })

  it('hides labels for walls that are tiny on screen, except the reference wall', () => {
    const transform: ViewTransform = { scale: 0.05, offset: { x: 100, y: 100 } }
    const labels = layoutDimensionLabels({
      vertices: lShape,
      wallLengthsMeters,
      referenceEdgeIndex: 3,
      transform,
      viewportSize: { width: 400, height: 300 },
    })
    expect(labels.map((l) => l.edgeIndex)).toEqual([3])
  })
})
