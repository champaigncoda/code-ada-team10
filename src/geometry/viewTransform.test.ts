import { describe, expect, it } from 'vitest'
import type { Point2D } from '../types/geometry'
import {
  type ViewLayout,
  computeFitScale,
  computeViewTransform,
  createFitCamera,
  imageToScreen,
  panCamera,
  screenToImage,
  zoomCameraAt,
} from './viewTransform'

// A 2000×1000 image in an 1000×600 canvas with 0 padding fits at scale 0.5,
// occupying 1000×500 and letterboxed by 50px top and bottom.
const layout: ViewLayout = {
  imageSize: { width: 2000, height: 1000 },
  viewportSize: { width: 1000, height: 600 },
  fitPadding: 0,
}

function expectPointClose(actual: Point2D, expected: Point2D): void {
  expect(actual.x).toBeCloseTo(expected.x, 9)
  expect(actual.y).toBeCloseTo(expected.y, 9)
}

describe('view transforms', () => {
  it('maps screen to image coordinates at the initial fit zoom', () => {
    const transform = computeViewTransform(createFitCamera(layout.imageSize), layout)
    expect(transform.scale).toBe(0.5)
    expectPointClose(screenToImage({ x: 0, y: 50 }, transform), { x: 0, y: 0 })
    expectPointClose(screenToImage({ x: 1000, y: 550 }, transform), { x: 2000, y: 1000 })
    expectPointClose(screenToImage({ x: 500, y: 300 }, transform), { x: 1000, y: 500 })
  })

  it('maps correctly after zooming around the cursor', () => {
    const cursor = { x: 250, y: 175 }
    const before = computeViewTransform(createFitCamera(layout.imageSize), layout)
    const imageUnderCursor = screenToImage(cursor, before)

    const zoomed = zoomCameraAt(createFitCamera(layout.imageSize), cursor, 4, layout)
    const after = computeViewTransform(zoomed, layout)

    expect(after.scale).toBe(2)
    expectPointClose(screenToImage(cursor, after), imageUnderCursor)
    // One screen pixel now spans half an image pixel.
    expectPointClose(screenToImage({ x: cursor.x + 1, y: cursor.y }, after), {
      x: imageUnderCursor.x + 0.5,
      y: imageUnderCursor.y,
    })
  })

  it('maps correctly after panning', () => {
    const camera = createFitCamera(layout.imageSize)
    const before = computeViewTransform(camera, layout)
    const panned = computeViewTransform(panCamera(camera, { x: 100, y: -40 }, layout), layout)

    // The image moves with the drag: the point previously at (400, 340) is now at (500, 300).
    expectPointClose(screenToImage({ x: 500, y: 300 }, panned), screenToImage({ x: 400, y: 340 }, before))
    expectPointClose(screenToImage({ x: 500, y: 300 }, panned), { x: 800, y: 580 })
  })

  it('round-trips image coordinates under arbitrary zoom and pan', () => {
    const vertex = { x: 1234.5, y: 678.25 }
    let camera = createFitCamera(layout.imageSize)
    camera = zoomCameraAt(camera, { x: 300, y: 200 }, 3.7, layout)
    camera = panCamera(camera, { x: -250, y: 90 }, layout)
    camera = zoomCameraAt(camera, { x: 820, y: 410 }, 0.4, layout)

    const transform = computeViewTransform(camera, layout)
    expectPointClose(screenToImage(imageToScreen(vertex, transform), transform), vertex)
  })

  it('keeps the same image point centered and aligned after resizing the canvas', () => {
    const camera = zoomCameraAt(createFitCamera(layout.imageSize), { x: 300, y: 200 }, 2, layout)
    const resized: ViewLayout = { ...layout, viewportSize: { width: 600, height: 900 } }

    const before = computeViewTransform(camera, layout)
    const after = computeViewTransform(camera, resized)

    expect(computeFitScale(resized)).toBe(0.3)
    expect(after.scale).toBeCloseTo(0.6, 12)
    expectPointClose(screenToImage({ x: 300, y: 450 }, after), screenToImage({ x: 500, y: 300 }, before))

    const vertex = { x: 1500, y: 250 }
    const onScreen = imageToScreen(vertex, after)
    expectPointClose(onScreen, { x: 300 + (1500 - camera.center.x) * 0.6, y: 450 + (250 - camera.center.y) * 0.6 })
    expectPointClose(screenToImage(onScreen, after), vertex)
  })

  it('preserves aspect ratio and respects padding when fitting', () => {
    expect(computeFitScale({ ...layout, fitPadding: 50 })).toBe(Math.min(900 / 2000, 500 / 1000))
  })
})
