import { useMemo, useState } from 'react'
import { formatMeters } from '../../calibration/scale'
import { FURNITURE_CATEGORY_LABELS } from '../catalog'
import { buildFurnitureLayout } from '../layout/buildFurnitureLayout'
import { useFurnitureDraft } from '../useFurnitureDraft'
import { FurnitureConfigPanel } from './FurnitureConfigPanel'
import { FurniturePreviewCanvas } from './FurniturePreviewCanvas'
import './FurnitureStudio.css'

export function FurnitureStudio() {
  const furniture = useFurnitureDraft()
  const [resetToken, setResetToken] = useState(0)
  const layout = useMemo(() => buildFurnitureLayout(furniture.preview), [furniture.preview])
  const { width, depth, height } = furniture.preview.dimensions

  return (
    <section className="furniture-studio" aria-label="Furniture preview">
      <div className="furniture-studio__toolbar">
        <p className="furniture-studio__summary">
          {FURNITURE_CATEGORY_LABELS[furniture.preview.category]} · {formatMeters(width)} × {formatMeters(depth)} ×{' '}
          {formatMeters(height)}
        </p>
        <button type="button" className="button button--secondary" onClick={() => setResetToken((token) => token + 1)}>
          Reset Camera
        </button>
      </div>
      <div className="furniture-studio__workspace">
        <div className="furniture-studio__frame">
          <FurniturePreviewCanvas
            layout={layout}
            color={furniture.preview.color}
            resetToken={resetToken}
            className="furniture-studio__canvas"
          />
        </div>
        <FurnitureConfigPanel
          draft={furniture.draft}
          onCategoryChange={furniture.selectCategory}
          onDimensionChange={furniture.changeDimension}
          onColorChange={furniture.changeColor}
        />
      </div>
      <p className="furniture-studio__hint">Drag to orbit · Scroll to zoom · Right-drag to pan</p>
    </section>
  )
}
