import { useId } from 'react'
import type { CalibrationStatus } from '../../../types/calibration'
import { parseReferenceLength } from '../referenceLength'
import { formatMeters } from '../scale'
import { wallName, wallVertexRange } from '../wallNames'
import './CalibrationPanel.css'

interface CalibrationPanelProps {
  /** False while the outline is still being drawn; the panel then only explains what comes next. */
  readonly isPolygonClosed: boolean
  readonly vertexCount: number
  readonly status: CalibrationStatus
  readonly referenceEdgeIndex: number | null
  readonly lengthInput: string
  readonly wallLengthsMeters: readonly number[] | null
  readonly canConfirm: boolean
  readonly onSelectWall: (edgeIndex: number) => void
  readonly onLengthChange: (input: string) => void
  readonly onConfirm: () => void
  readonly onRecalibrate: () => void
}

const STATUS_LABELS: Record<CalibrationStatus, string> = {
  uncalibrated: 'Not calibrated',
  editing: 'Review dimensions',
  confirmed: 'Confirmed',
}

export function CalibrationPanel({
  isPolygonClosed,
  vertexCount,
  status,
  referenceEdgeIndex,
  lengthInput,
  wallLengthsMeters,
  canConfirm,
  onSelectWall,
  onLengthChange,
  onConfirm,
  onRecalibrate,
}: CalibrationPanelProps) {
  const inputId = useId()
  const messageId = useId()

  if (!isPolygonClosed) {
    return (
      <aside className="calibration-panel" aria-label="Room dimensions">
        <h2 className="calibration-panel__title">Room dimensions</h2>
        <p className="calibration-panel__hint">Close the room outline to set its real-world dimensions.</p>
      </aside>
    )
  }

  const isConfirmed = status === 'confirmed'
  const parsed = parseReferenceLength(lengthInput)
  const showInvalid = !parsed.ok && lengthInput.trim() !== ''

  return (
    <aside className="calibration-panel" aria-label="Room dimensions">
      <div className="calibration-panel__header">
        <h2 className="calibration-panel__title">Room dimensions</h2>
        <span className={`calibration-status calibration-status--${status}`} data-testid="calibration-status">
          {isConfirmed && '✓ '}
          {STATUS_LABELS[status]}
        </span>
      </div>

      {referenceEdgeIndex === null ? (
        <p className="calibration-panel__prompt">Select a wall to set its actual length.</p>
      ) : (
        <div className="calibration-panel__reference">
          <p className="calibration-panel__reference-name">
            Reference wall: <strong>{wallName(referenceEdgeIndex)}</strong>{' '}
            <span className="calibration-panel__muted">({wallVertexRange(referenceEdgeIndex, vertexCount)})</span>
          </p>
          <label htmlFor={inputId} className="calibration-panel__label">
            Actual length of {wallName(referenceEdgeIndex)}
          </label>
          <div className="length-input">
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 3.75"
              value={lengthInput}
              disabled={isConfirmed}
              aria-invalid={showInvalid}
              aria-describedby={messageId}
              onChange={(event) => onLengthChange(event.target.value)}
            />
            <span className="length-input__unit">m</span>
          </div>
          <p
            id={messageId}
            className={`calibration-panel__message${showInvalid ? ' calibration-panel__message--error' : ''}`}
          >
            {parsed.ok ? 'All other walls are scaled from this measurement.' : parsed.message}
          </p>
        </div>
      )}

      {vertexCount > 0 && (
        <ol className="wall-list" aria-label="Wall lengths">
          {Array.from({ length: vertexCount }, (_, edgeIndex) => {
            const isReference = edgeIndex === referenceEdgeIndex
            const lengthMeters = wallLengthsMeters?.[edgeIndex]
            return (
              <li key={edgeIndex}>
                <button
                  type="button"
                  className={`wall-list__item${isReference ? ' wall-list__item--reference' : ''}`}
                  disabled={isConfirmed}
                  onClick={() => onSelectWall(edgeIndex)}
                  title={isConfirmed ? undefined : `Use ${wallName(edgeIndex)} as the reference`}
                >
                  <span>
                    {wallName(edgeIndex)}
                    {isReference && <span className="wall-list__tag">reference</span>}
                  </span>
                  <span className="wall-list__length">
                    {lengthMeters === undefined ? '—' : formatMeters(lengthMeters)}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {isConfirmed ? (
        <div className="calibration-panel__confirmed">
          <p role="status">Dimensions confirmed. Walls are locked for the next step.</p>
          <button type="button" className="button button--secondary" onClick={onRecalibrate}>
            Re-calibrate
          </button>
        </div>
      ) : (
        <button type="button" className="button button--primary" disabled={!canConfirm} onClick={onConfirm}>
          Confirm Dimensions
        </button>
      )}
    </aside>
  )
}
