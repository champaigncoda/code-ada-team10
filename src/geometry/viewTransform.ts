import type { Point2D, Size2D } from '../types/geometry'

/**
 * Maps image pixels to screen (canvas CSS) pixels:
 *   screen = image * scale + offset
 * Purely visual; stored geometry never passes through it except to render.
 */
export interface ViewTransform {
  readonly scale: number
  readonly offset: Point2D
}

/**
 * Resize-independent view state. `zoom` is relative to the fit-to-canvas
 * scale and `center` is the image point shown at the canvas center, so a
 * resized canvas keeps showing the same part of the image.
 */
export interface Camera {
  readonly zoom: number
  readonly center: Point2D
}

export interface ViewLayout {
  readonly imageSize: Size2D
  readonly viewportSize: Size2D
  /** Screen-space margin kept around the image at zoom 1. */
  readonly fitPadding: number
}

export function screenToImage(screen: Point2D, transform: ViewTransform): Point2D {
  return {
    x: (screen.x - transform.offset.x) / transform.scale,
    y: (screen.y - transform.offset.y) / transform.scale,
  }
}

export function imageToScreen(image: Point2D, transform: ViewTransform): Point2D {
  return {
    x: image.x * transform.scale + transform.offset.x,
    y: image.y * transform.scale + transform.offset.y,
  }
}

/** Largest scale at which the whole image fits inside the padded viewport, preserving aspect ratio. */
export function computeFitScale({ imageSize, viewportSize, fitPadding }: ViewLayout): number {
  const availableWidth = Math.max(viewportSize.width - 2 * fitPadding, 1)
  const availableHeight = Math.max(viewportSize.height - 2 * fitPadding, 1)
  return Math.min(availableWidth / imageSize.width, availableHeight / imageSize.height)
}

export function createFitCamera(imageSize: Size2D): Camera {
  return { zoom: 1, center: { x: imageSize.width / 2, y: imageSize.height / 2 } }
}

export function computeViewTransform(camera: Camera, layout: ViewLayout): ViewTransform {
  const scale = computeFitScale(layout) * camera.zoom
  return {
    scale,
    offset: {
      x: layout.viewportSize.width / 2 - camera.center.x * scale,
      y: layout.viewportSize.height / 2 - camera.center.y * scale,
    },
  }
}

/** Changes zoom while keeping the image point under `screenAnchor` fixed on screen. */
export function zoomCameraAt(camera: Camera, screenAnchor: Point2D, zoom: number, layout: ViewLayout): Camera {
  const anchor = screenToImage(screenAnchor, computeViewTransform(camera, layout))
  const scale = computeFitScale(layout) * zoom
  return {
    zoom,
    center: {
      x: anchor.x + (layout.viewportSize.width / 2 - screenAnchor.x) / scale,
      y: anchor.y + (layout.viewportSize.height / 2 - screenAnchor.y) / scale,
    },
  }
}

/** Moves the view so the image follows a screen-space drag of `screenDelta`. */
export function panCamera(camera: Camera, screenDelta: Point2D, layout: ViewLayout): Camera {
  const scale = computeFitScale(layout) * camera.zoom
  return {
    zoom: camera.zoom,
    center: {
      x: camera.center.x - screenDelta.x / scale,
      y: camera.center.y - screenDelta.y / scale,
    },
  }
}
