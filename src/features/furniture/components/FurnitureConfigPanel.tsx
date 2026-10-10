import { useId } from 'react'
import type { FurnitureCategory, FurnitureDimensionAxis } from '../../../types/furniture'
import {
  FURNITURE_CATEGORIES,
  FURNITURE_CATEGORY_LABELS,
  FURNITURE_COLOR_PRESETS,
} from '../catalog'
import type { FurnitureDraft } from '../furnitureConfig'
import { describeUnbuildableFurniture, parseFurnitureDimension } from '../furnitureConfig'
import './FurnitureConfigPanel.css'

const AXES: readonly { readonly axis: FurnitureDimensionAxis; readonly label: string }[] = [
  { axis: 'width', label: 'Width' },
  { axis: 'depth', label: 'Depth' },
  { axis: 'height', label: 'Height' },
]

interface FurnitureConfigFieldsProps {
  readonly draft: FurnitureDraft
  readonly onCategoryChange: (category: FurnitureCategory) => void
  readonly onDimensionChange: (axis: FurnitureDimensionAxis, input: string) => void
  readonly onColorChange: (color: string) => void
  /** Edit mode shows the category as text; creation still offers the three buttons. */
  readonly showCategory?: boolean
}

export function FurnitureConfigFields({
  draft,
  onCategoryChange,
  onDimensionChange,
  onColorChange,
  showCategory = true,
}: FurnitureConfigFieldsProps) {
  const colorPickerId = useId()
  const inputs = { width: draft.widthInput, depth: draft.depthInput, height: draft.heightInput }
  const geometryMessage = describeUnbuildableFurniture(draft)

  return (
    <>
      {showCategory ? (
        <div className="furniture-categories" role="group" aria-label="Furniture category">
        {FURNITURE_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`furniture-category${draft.category === category ? ' furniture-category--selected' : ''}`}
            aria-pressed={draft.category === category}
            onClick={() => onCategoryChange(category)}
          >
            {FURNITURE_CATEGORY_LABELS[category]}
          </button>
        ))}
        </div>
      ) : null}

      {AXES.map(({ axis, label }) => {
        const inputId = `${colorPickerId}-${axis}`
        const messageId = `${inputId}-message`
        const parsed = parseFurnitureDimension(inputs[axis], draft.category, axis)
        return (
          <div key={axis} className="furniture-field">
            <label htmlFor={inputId} className="furniture-field__label">
              {label}
            </label>
            <div className="length-input">
              <input
                id={inputId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={inputs[axis]}
                aria-invalid={!parsed.ok}
                aria-describedby={messageId}
                onChange={(event) => onDimensionChange(axis, event.target.value)}
              />
              <span className="length-input__unit">m</span>
            </div>
            <p
              id={messageId}
              className={`furniture-field__message${parsed.ok ? '' : ' furniture-field__message--error'}`}
            >
              {parsed.ok ? `Overall ${label.toLowerCase()} in meters.` : parsed.message}
            </p>
          </div>
        )
      })}

      {geometryMessage ? (
        <p className="furniture-field__message furniture-field__message--error" role="alert">
          {geometryMessage}
        </p>
      ) : null}

      <fieldset className="furniture-colors">
        <legend>Color</legend>
        <div className="furniture-swatches">
          {FURNITURE_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={`furniture-swatch${draft.color === preset.value ? ' furniture-swatch--selected' : ''}`}
              style={{ background: preset.value }}
              aria-label={preset.name}
              aria-pressed={draft.color === preset.value}
              onClick={() => onColorChange(preset.value)}
            />
          ))}
        </div>
        <div className="furniture-custom-color">
          <label htmlFor={`${colorPickerId}-custom`}>Custom</label>
          <input
            id={`${colorPickerId}-custom`}
            type="color"
            value={draft.color}
            onChange={(event) => onColorChange(event.target.value)}
          />
          <span className="furniture-custom-color__value">{draft.color}</span>
        </div>
      </fieldset>
    </>
  )
}

export function FurnitureConfigPanel({
  draft,
  onCategoryChange,
  onDimensionChange,
  onColorChange,
}: FurnitureConfigFieldsProps) {
  return (
    <aside className="furniture-panel" aria-label="Furniture configuration">
      <h2 className="furniture-panel__title">Furniture</h2>
      <FurnitureConfigFields
        draft={draft}
        onCategoryChange={onCategoryChange}
        onDimensionChange={onDimensionChange}
        onColorChange={onColorChange}
      />
    </aside>
  )
}
