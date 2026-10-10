import { distance } from '../../geometry/point'
import { getEdge, signedArea } from '../../geometry/polygon'
import { imageToScreen, type ViewTransform } from '../../geometry/viewTransform'
import type { Point2D, Size2D } from '../../types/geometry'
import { clamp } from '../../utils/math'
import { DIMENSION_LABEL_FONT_PX, DIMENSION_LABEL_OFFSET_PX, MIN_LABELED_EDGE_SCREEN_PX } from './constants'
import { formatMeters } from './scale'

export interface DimensionLabel {
  readonly edgeIndex: number
  readonly text: string
  /** Label center in screen (canvas CSS) pixels. */
  readonly screen: Point2D
  readonly isReference: boolean
}

interface LabelLayoutInput {
  readonly vertices: readonly Point2D[]
  readonly wallLengthsMeters: readonly number[]
  readonly referenceEdgeIndex: number | null
  readonly transform: ViewTransform
  readonly viewportSize: Size2D
}

/** Rough label half-extent, used only to keep labels inside the canvas. */
function estimateHalfSize(text: string): Size2D {
  return { width: (text.length * DIMENSION_LABEL_FONT_PX * 0.62) / 2 + 6, height: DIMENSION_LABEL_FONT_PX / 2 + 4 }
}

/**
 * Places one label per wall: anchored at the edge's midpoint (computed in
 * image space), pushed a fixed screen distance outside the room, and clamped
 * inside the canvas. Labels whose wall midpoint is off-screen, or whose wall
 * is too short on screen, are omitted (the reference wall is always kept).
 */
export function layoutDimensionLabels({
  vertices,
  wallLengthsMeters,
  referenceEdgeIndex,
  transform,
  viewportSize,
}: LabelLayoutInput): DimensionLabel[] {
  const outwardSign = signedArea(vertices) >= 0 ? 1 : -1
  const labels: DimensionLabel[] = []

  wallLengthsMeters.forEach((lengthMeters, edgeIndex) => {
    if (edgeIndex >= vertices.length) return
    const [start, end] = getEdge(vertices, edgeIndex)
    const midpoint = imageToScreen({ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, transform)
    const isReference = edgeIndex === referenceEdgeIndex

    const isMidpointVisible =
      midpoint.x >= 0 && midpoint.y >= 0 && midpoint.x <= viewportSize.width && midpoint.y <= viewportSize.height
    const screenLength = distance(start, end) * transform.scale
    if (!isMidpointVisible || (!isReference && screenLength < MIN_LABELED_EDGE_SCREEN_PX)) return

    // Uniform scale + translation preserve direction, so the image-space normal applies on screen.
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.hypot(dx, dy) || 1
    const offsetX = ((outwardSign * dy) / length) * DIMENSION_LABEL_OFFSET_PX
    const offsetY = ((outwardSign * -dx) / length) * DIMENSION_LABEL_OFFSET_PX

    const text = formatMeters(lengthMeters)
    const half = estimateHalfSize(text)
    labels.push({
      edgeIndex,
      text,
      isReference,
      screen: {
        x: clamp(midpoint.x + offsetX, half.width, Math.max(half.width, viewportSize.width - half.width)),
        y: clamp(midpoint.y + offsetY, half.height, Math.max(half.height, viewportSize.height - half.height)),
      },
    })
  })
  return labels
}
