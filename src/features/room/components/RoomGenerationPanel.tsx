import { useId } from 'react'
import { parseRoomHeight } from '../roomHeight'
import './RoomGenerationPanel.css'

interface RoomGenerationPanelProps {
  readonly heightInput: string
  readonly isCalibrationConfirmed: boolean
  readonly canGenerate: boolean
  readonly onHeightChange: (input: string) => void
  readonly onGenerate: () => void
}

export function RoomGenerationPanel({
  heightInput,
  isCalibrationConfirmed,
  canGenerate,
  onHeightChange,
  onGenerate,
}: RoomGenerationPanelProps) {
  const inputId = useId()
  const messageId = useId()
  const parsed = parseRoomHeight(heightInput)

  return (
    <section className="room-generation-panel" aria-label="3D room">
      <h2 className="room-generation-panel__title">3D room</h2>
      <label htmlFor={inputId} className="room-generation-panel__label">
        Room height
      </label>
      <div className="length-input">
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="e.g. 2.8"
          value={heightInput}
          aria-invalid={!parsed.ok}
          aria-describedby={messageId}
          onChange={(event) => onHeightChange(event.target.value)}
        />
        <span className="length-input__unit">m</span>
      </div>
      <p
        id={messageId}
        className={`room-generation-panel__message${parsed.ok ? '' : ' room-generation-panel__message--error'}`}
      >
        {parsed.ok ? 'Floor to top of the walls.' : parsed.message}
      </p>
      {!isCalibrationConfirmed && (
        <p className="room-generation-panel__hint">Confirm the room dimensions to enable 3D generation.</p>
      )}
      <button type="button" className="button button--primary" disabled={!canGenerate} onClick={onGenerate}>
        Generate 3D Room
      </button>
    </section>
  )
}
