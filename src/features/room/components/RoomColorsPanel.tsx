import { useId } from 'react'
import type { RoomAppearance, RoomSurface } from '../../../types/room'
import { roomColorFor, roomColorPresets } from '../appearance'
import './RoomColorsPanel.css'

interface RoomColorsPanelProps {
  readonly appearance: RoomAppearance
  readonly onColorChange: (surface: RoomSurface, color: string) => void
}

const SURFACES: readonly { readonly surface: RoomSurface; readonly label: string; readonly noun: string }[] = [
  { surface: 'floor', label: 'Floor', noun: 'floor' },
  { surface: 'wall', label: 'Walls', noun: 'wall' },
]

export function RoomColorsPanel({ appearance, onColorChange }: RoomColorsPanelProps) {
  const baseId = useId()
  return (
    <section className="room-colors" aria-label="Room colors">
      <h3 className="room-colors__title">Room colors</h3>
      {SURFACES.map(({ surface, label, noun }) => {
        const current = roomColorFor(appearance, surface)
        const customId = `${baseId}-${surface}-custom`
        return (
          <fieldset key={surface} className="room-colors__group">
            <legend>{label}</legend>
            <div className="room-colors__swatches">
              {roomColorPresets(surface).map((preset) => {
                const selected = current === preset.value
                return (
                  <button
                    key={preset.value}
                    type="button"
                    className={`room-colors__swatch${selected ? ' room-colors__swatch--selected' : ''}`}
                    style={{ background: preset.value }}
                    title={preset.name}
                    aria-label={`${label}: ${preset.name}`}
                    aria-pressed={selected}
                    onClick={() => onColorChange(surface, preset.value)}
                  />
                )
              })}
            </div>
            <div className="room-colors__custom">
              <label htmlFor={customId}>Custom</label>
              <input
                id={customId}
                type="color"
                aria-label={`Custom ${noun} color`}
                value={current}
                onChange={(event) => onColorChange(surface, event.target.value)}
              />
              <span className="room-colors__value">{current}</span>
            </div>
          </fieldset>
        )
      })}
    </section>
  )
}
