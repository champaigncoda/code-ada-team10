import type { FurnitureLayout } from '../../../types/furniture'
import { FurnitureModel } from './FurnitureModel'
import { PreviewCameraRig } from './PreviewCameraRig'

interface FurniturePreviewSceneProps {
  readonly layout: FurnitureLayout
  readonly color: string
  readonly resetToken: number
}

export function FurniturePreviewScene({ layout, color, resetToken }: FurniturePreviewSceneProps) {
  const { width, depth, height } = layout.dimensions
  return (
    <>
      <color attach="background" args={['#e4e7ee']} />
      <ambientLight intensity={0.58} />
      <directionalLight
        position={[2.8, 5.2, 3.4]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.2}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-3, 2.4, -2]} intensity={0.25} />
      <mesh name="preview-ground" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
        <planeGeometry args={[Math.max(width, depth) * 6, Math.max(width, depth) * 6]} />
        <meshStandardMaterial color="#eceff4" roughness={0.95} metalness={0} />
      </mesh>
      <gridHelper
        args={[Math.max(width, depth) * 4, 16, '#b4bac6', '#d5d9e1']}
        position={[0, -0.001, 0]}
      />
      <FurnitureModel layout={layout} color={color} />
      <PreviewCameraRig extent={{ width, depth, height }} resetToken={resetToken} />
    </>
  )
}
