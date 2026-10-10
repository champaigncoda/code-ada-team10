import { MIN_POLYGON_VERTICES } from '../constants'

interface EditorStatusProps {
  readonly vertexCount: number
  readonly isClosed: boolean
  readonly isCalibrationConfirmed: boolean
}

function getInstruction(vertexCount: number, isClosed: boolean, isCalibrationConfirmed: boolean): string {
  if (isClosed && isCalibrationConfirmed) {
    return 'Dimensions confirmed. Set the room height and generate the 3D room.'
  }
  if (isClosed) return 'Room outline complete. Set its real-world size in the Room dimensions panel.'
  if (vertexCount === 0) return 'Click a corner of the room on the floor plan to place the first vertex.'
  if (vertexCount < MIN_POLYGON_VERTICES) return 'Keep clicking along the walls to place each corner in order.'
  return 'Click the first vertex (it highlights when you are close) to close the outline.'
}

export function EditorStatus({ vertexCount, isClosed, isCalibrationConfirmed }: EditorStatusProps) {
  return (
    <div className="editor-status">
      <span className={`status-badge status-badge--${isClosed ? 'closed' : 'drawing'}`}>
        {isClosed ? 'Closed' : 'Drawing'} · {vertexCount} {vertexCount === 1 ? 'vertex' : 'vertices'}
      </span>
      <p className="editor-status__instruction">{getInstruction(vertexCount, isClosed, isCalibrationConfirmed)}</p>
      <p className="editor-status__navigation">
        <kbd>Scroll</kbd> to zoom · Hold <kbd>Space</kbd> and drag, or drag with the middle button, to pan
      </p>
    </div>
  )
}
