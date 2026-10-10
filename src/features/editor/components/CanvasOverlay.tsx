import type { Point2D } from '../../../types/geometry'

interface CanvasOverlayProps {
  readonly zoom: number
  readonly pointerImage: Point2D | null
  readonly onFitToView: () => void
}

/** Sits outside the interactive surface so its clicks never place vertices. */
export function CanvasOverlay({ zoom, pointerImage, onFitToView }: CanvasOverlayProps) {
  return (
    <div className="canvas-overlay">
      {pointerImage && (
        <span className="canvas-overlay__readout" title="Cursor position in original image pixels">
          {Math.round(pointerImage.x)}, {Math.round(pointerImage.y)} px
        </span>
      )}
      <span className="canvas-overlay__readout">{Math.round(zoom * 100)}%</span>
      <button type="button" className="button button--small" onClick={onFitToView}>
        Fit to view
      </button>
    </div>
  )
}
