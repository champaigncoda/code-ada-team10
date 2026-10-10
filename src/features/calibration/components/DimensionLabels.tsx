import type { ViewTransform } from '../../../geometry/viewTransform'
import type { Point2D, Size2D } from '../../../types/geometry'
import { DIMENSION_LABEL_FONT_PX } from '../constants'
import { layoutDimensionLabels } from '../dimensionLabels'
import { wallName } from '../wallNames'
import './DimensionLabels.css'

interface DimensionLabelsProps {
  readonly vertices: readonly Point2D[]
  readonly wallLengthsMeters: readonly number[]
  readonly referenceEdgeIndex: number | null
  readonly transform: ViewTransform
  readonly viewportSize: Size2D
}

/**
 * HTML overlay positioned in screen space, so text stays a fixed CSS size at
 * every zoom. `pointer-events: none` lets clicks and wheel events reach the canvas.
 */
export function DimensionLabels(props: DimensionLabelsProps) {
  const labels = layoutDimensionLabels(props)
  return (
    <div className="dimension-labels" aria-hidden="true">
      {labels.map((label) => (
        <span
          key={label.edgeIndex}
          className={`dimension-label${label.isReference ? ' dimension-label--reference' : ''}`}
          style={{ left: label.screen.x, top: label.screen.y, fontSize: DIMENSION_LABEL_FONT_PX }}
          title={wallName(label.edgeIndex)}
          data-edge-index={label.edgeIndex}
        >
          {label.text}
        </span>
      ))}
    </div>
  )
}
