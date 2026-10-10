import { Canvas } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { formatMeters } from '../../calibration/scale'
import { VIEWER_FOV_DEGREES } from '../../viewer/camera/cameraView'
import { FURNITURE_CATEGORY_LABELS } from '../catalog'
import { buildFurnitureLayout } from '../layout/buildFurnitureLayout'
import { useFurnitureDraft } from '../useFurnitureDraft'
import { FurnitureConfigPanel } from './FurnitureConfigPanel'
import { FurniturePreviewScene } from './FurniturePreviewScene'
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
          {layout ? (
            <Canvas
              className="furniture-studio__canvas"
              shadows
              camera={{ fov: VIEWER_FOV_DEGREES, near: 0.05, far: 80, position: [2, 2, 2] }}
              gl={{ antialias: true }}
              style={{ background: '#e4e7ee' }}
            >
              <FurniturePreviewScene layout={layout} color={furniture.preview.color} resetToken={resetToken} />
            </Canvas>
          ) : (
            <p className="furniture-studio__error" role="alert">
              Enter valid dimensions to preview this furniture.
            </p>
          )}
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
