import { useMemo, useRef, useState } from 'react'
import { Image as KonvaImage, Layer, Stage } from 'react-konva'
import { findNearestEdge } from '../../../geometry/edgeHitTest'
import { clampPointToImage, isPointInImage } from '../../../geometry/imageBounds'
import { isWithinScreenRadius } from '../../../geometry/snap'
import {
  type Camera,
  type ViewLayout,
  computeViewTransform,
  createFitCamera,
  panCamera,
  screenToImage,
  zoomCameraAt,
} from '../../../geometry/viewTransform'
import type { Point2D } from '../../../types/geometry'
import { clamp } from '../../../utils/math'
import { DimensionLabels } from '../../calibration/components/DimensionLabels'
import { EDGE_SELECT_THRESHOLD_PX } from '../../calibration/constants'
import { CLOSE_SNAP_RADIUS_PX, FIT_PADDING_PX, MAX_ZOOM, MIN_POLYGON_VERTICES, MIN_ZOOM } from '../constants'
import { useCanvasGestures } from '../hooks/useCanvasGestures'
import { useElementSize } from '../hooks/useElementSize'
import { useSpaceKeyHeld } from '../hooks/useSpaceKeyHeld'
import { useWheelZoom } from '../hooks/useWheelZoom'
import type { LoadedFloorPlan } from '../loadFloorPlanImage'
import { CanvasOverlay } from './CanvasOverlay'
import { PolygonLayer } from './PolygonLayer'

interface FloorPlanCanvasProps {
  readonly floorPlan: LoadedFloorPlan
  readonly vertices: readonly Point2D[]
  readonly isClosed: boolean
  /** Whether clicking a wall of the closed outline selects it as the calibration reference. */
  readonly isEdgeSelectionEnabled: boolean
  readonly referenceEdgeIndex: number | null
  readonly wallLengthsMeters: readonly number[] | null
  readonly onCanvasClick: (imagePoint: Point2D, isNearFirstVertex: boolean) => void
  readonly onEdgeSelect: (edgeIndex: number) => void
}

/**
 * Renders the floor plan and outline, and translates pointer input into
 * image-space clicks (while drawing) or wall selections (once closed).
 * Remount (via `key`) when the image changes so the view resets to fit.
 */
export function FloorPlanCanvas({
  floorPlan,
  vertices,
  isClosed,
  isEdgeSelectionEnabled,
  referenceEdgeIndex,
  wallLengthsMeters,
  onCanvasClick,
  onEdgeSelect,
}: FloorPlanCanvasProps) {
  const imageSize = floorPlan.image.size
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportSize = useElementSize(containerRef)
  const [camera, setCamera] = useState<Camera>(() => createFitCamera(imageSize))
  const [pointer, setPointer] = useState<Point2D | null>(null)
  const isSpaceHeld = useSpaceKeyHeld(pointer !== null)

  const layout = useMemo<ViewLayout | null>(
    () =>
      viewportSize && viewportSize.width > 0 && viewportSize.height > 0
        ? { imageSize, viewportSize, fitPadding: FIT_PADDING_PX }
        : null,
    [imageSize, viewportSize],
  )
  const transform = layout ? computeViewTransform(camera, layout) : null

  function isNearFirstVertex(screen: Point2D): boolean {
    const first = vertices[0]
    return !!first && !!transform && isWithinScreenRadius(screen, first, transform, CLOSE_SNAP_RADIUS_PX)
  }

  function edgeAt(screen: Point2D): number | null {
    if (!isClosed || !isEdgeSelectionEnabled || !transform) return null
    return findNearestEdge(screen, vertices, transform, EDGE_SELECT_THRESHOLD_PX)
  }

  function handleClick(screen: Point2D) {
    if (!transform) return
    if (isClosed) {
      const edgeIndex = edgeAt(screen)
      if (edgeIndex !== null) onEdgeSelect(edgeIndex)
      return
    }
    onCanvasClick(screenToImage(screen, transform), isNearFirstVertex(screen))
  }

  const { handlers, isPanning } = useCanvasGestures({
    isSpaceHeld,
    onHover: setPointer,
    onPan: (delta) => layout && setCamera((current) => panCamera(current, delta, layout)),
    onClick: handleClick,
  })

  useWheelZoom(containerRef, (anchor, factor) => {
    if (!layout) return
    setCamera((current) => zoomCameraAt(current, anchor, clamp(current.zoom * factor, MIN_ZOOM, MAX_ZOOM), layout))
  })

  const isNavigating = isPanning || isSpaceHeld
  const pointerImage = pointer && transform ? screenToImage(pointer, transform) : null
  const canClose = !isClosed && vertices.length >= MIN_POLYGON_VERTICES
  const isSnapping = canClose && !isNavigating && pointer !== null && isNearFirstVertex(pointer)
  const hoveredEdgeIndex = !isNavigating && pointer ? edgeAt(pointer) : null

  let previewTarget: Point2D | null = null
  if (!isClosed && !isNavigating && pointerImage) {
    previewTarget = isSnapping && vertices[0] ? vertices[0] : clampPointToImage(pointerImage, imageSize)
  }

  let cursor = 'crosshair'
  if (isPanning) cursor = 'grabbing'
  else if (isSpaceHeld) cursor = 'grab'
  else if (isClosed) cursor = hoveredEdgeIndex !== null ? 'pointer' : 'default'

  return (
    <div className="floor-plan-canvas">
      <div ref={containerRef} className="floor-plan-canvas__surface" style={{ cursor }} {...handlers}>
        {viewportSize && transform && (
          <>
            <Stage
              width={viewportSize.width}
              height={viewportSize.height}
              scaleX={transform.scale}
              scaleY={transform.scale}
              x={transform.offset.x}
              y={transform.offset.y}
            >
              <Layer listening={false}>
                <KonvaImage image={floorPlan.element} width={imageSize.width} height={imageSize.height} />
              </Layer>
              <PolygonLayer
                vertices={vertices}
                isClosed={isClosed}
                previewTarget={previewTarget}
                isFirstVertexHighlighted={isSnapping}
                referenceEdgeIndex={isClosed ? referenceEdgeIndex : null}
                hoveredEdgeIndex={hoveredEdgeIndex}
                scale={transform.scale}
              />
            </Stage>
            {isClosed && wallLengthsMeters && (
              <DimensionLabels
                vertices={vertices}
                wallLengthsMeters={wallLengthsMeters}
                referenceEdgeIndex={referenceEdgeIndex}
                transform={transform}
                viewportSize={viewportSize}
              />
            )}
          </>
        )}
      </div>
      <CanvasOverlay
        zoom={camera.zoom}
        pointerImage={pointerImage && isPointInImage(pointerImage, imageSize) ? pointerImage : null}
        onFitToView={() => setCamera(createFitCamera(imageSize))}
      />
    </div>
  )
}
