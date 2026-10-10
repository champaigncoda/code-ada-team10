import { Canvas } from '@react-three/fiber'
import type { FurnitureLayout } from '../../../types/furniture'
import { VIEWER_FOV_DEGREES } from '../../viewer/camera/cameraView'
import { FurniturePreviewScene } from './FurniturePreviewScene'

interface FurniturePreviewCanvasProps {
  readonly layout: FurnitureLayout | null
  readonly color: string
  readonly resetToken: number
  readonly className?: string
}

/** The Phase 4 preview scene, sized by the parent. Orbit stays local to this canvas. */
export function FurniturePreviewCanvas({ layout, color, resetToken, className }: FurniturePreviewCanvasProps) {
  if (!layout) {
    return (
      <p className="furniture-studio__error" role="alert">
        These dimensions are too small to build a recognizable model. Increase the width, depth, or height.
      </p>
    )
  }
  return (
    <Canvas
      className={className}
      camera={{ fov: VIEWER_FOV_DEGREES, near: 0.05, far: 80, position: [2, 2, 2] }}
      gl={{ antialias: true }}
      style={{ background: '#e4e7ee' }}
    >
      <FurniturePreviewScene layout={layout} color={color} resetToken={resetToken} />
    </Canvas>
  )
}
