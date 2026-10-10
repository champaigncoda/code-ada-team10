import { Circle, Layer, Line } from 'react-konva'
import { getEdge } from '../../../geometry/polygon'
import type { Point2D } from '../../../types/geometry'
import { CLOSE_SNAP_RADIUS_PX } from '../constants'

const EDGE_COLOR = '#2563eb'
const FILL_COLOR = 'rgba(37, 99, 235, 0.16)'
const SNAP_COLOR = '#f59e0b'
const REFERENCE_EDGE_COLOR = '#ea580c'

const EDGE_WIDTH_PX = 2
const HOVERED_EDGE_WIDTH_PX = 6
const REFERENCE_EDGE_WIDTH_PX = 5
const VERTEX_RADIUS_PX = 5
const FIRST_VERTEX_RADIUS_PX = 7

interface PolygonLayerProps {
  readonly vertices: readonly Point2D[]
  readonly isClosed: boolean
  /** Image-space end point of the dashed preview edge, or null to hide it. */
  readonly previewTarget: Point2D | null
  readonly isFirstVertexHighlighted: boolean
  readonly referenceEdgeIndex: number | null
  readonly hoveredEdgeIndex: number | null
  /** Current image-to-screen scale, used to keep markers a constant on-screen size. */
  readonly scale: number
}

function flatten(points: readonly Point2D[]): number[] {
  return points.flatMap((point) => [point.x, point.y])
}

function edgePoints(vertices: readonly Point2D[], edgeIndex: number | null): number[] | null {
  if (edgeIndex === null || edgeIndex < 0 || edgeIndex >= vertices.length) return null
  return flatten(getEdge(vertices, edgeIndex))
}

/** Draws in image coordinates; sizes are divided by `scale` so they stay fixed in screen pixels. */
export function PolygonLayer({
  vertices,
  isClosed,
  previewTarget,
  isFirstVertexHighlighted,
  referenceEdgeIndex,
  hoveredEdgeIndex,
  scale,
}: PolygonLayerProps) {
  const last = vertices.at(-1)
  const px = (screenPixels: number) => screenPixels / scale
  const hoveredEdge = hoveredEdgeIndex !== referenceEdgeIndex ? edgePoints(vertices, hoveredEdgeIndex) : null
  const referenceEdge = edgePoints(vertices, referenceEdgeIndex)

  return (
    <Layer listening={false}>
      <Line
        points={flatten(vertices)}
        closed={isClosed}
        fill={isClosed ? FILL_COLOR : undefined}
        stroke={EDGE_COLOR}
        strokeWidth={EDGE_WIDTH_PX}
        strokeScaleEnabled={false}
        lineJoin="round"
      />
      {hoveredEdge && (
        <Line
          points={hoveredEdge}
          stroke={REFERENCE_EDGE_COLOR}
          strokeWidth={HOVERED_EDGE_WIDTH_PX}
          strokeScaleEnabled={false}
          lineCap="round"
          opacity={0.35}
        />
      )}
      {referenceEdge && (
        <Line
          points={referenceEdge}
          stroke={REFERENCE_EDGE_COLOR}
          strokeWidth={REFERENCE_EDGE_WIDTH_PX}
          strokeScaleEnabled={false}
          lineCap="round"
        />
      )}
      {last && previewTarget && (
        <Line
          points={flatten([last, previewTarget])}
          stroke={EDGE_COLOR}
          strokeWidth={EDGE_WIDTH_PX}
          strokeScaleEnabled={false}
          dash={[px(6), px(4)]}
          opacity={0.8}
        />
      )}
      {isFirstVertexHighlighted && vertices[0] && (
        <Circle
          x={vertices[0].x}
          y={vertices[0].y}
          radius={px(CLOSE_SNAP_RADIUS_PX)}
          fill="rgba(245, 158, 11, 0.18)"
          stroke={SNAP_COLOR}
          strokeWidth={1}
          strokeScaleEnabled={false}
        />
      )}
      {vertices.map((vertex, index) => {
        const isFirst = index === 0
        const isHighlighted = isFirst && isFirstVertexHighlighted
        return (
          <Circle
            key={index}
            x={vertex.x}
            y={vertex.y}
            radius={px(isFirst ? FIRST_VERTEX_RADIUS_PX : VERTEX_RADIUS_PX)}
            fill={isHighlighted ? SNAP_COLOR : '#ffffff'}
            stroke={isHighlighted ? SNAP_COLOR : EDGE_COLOR}
            strokeWidth={EDGE_WIDTH_PX}
            strokeScaleEnabled={false}
          />
        )
      })}
    </Layer>
  )
}
