import { ContactShadows } from '@react-three/drei'
import { useLayoutEffect, useRef } from 'react'
import type { GridHelper } from 'three'
import type { FurnitureLayout } from '../../../types/furniture'
import { FurnitureModel } from './FurnitureModel'
import { PreviewCameraRig } from './PreviewCameraRig'

interface FurniturePreviewSceneProps {
  readonly layout: FurnitureLayout
  readonly color: string
  readonly resetToken: number
}

/**
 * Neutral floor under the model. The solid plane sits a few millimetres below
 * Y = 0 so it does not share a plane with the furniture bottom. Polygon offset
 * keeps the grid lines stable on that same plane.
 */
function PreviewFloor({ span }: { readonly span: number }) {
  const gridRef = useRef<GridHelper>(null)
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const materials = Array.isArray(grid.material) ? grid.material : [grid.material]
    for (const material of materials) {
      material.depthWrite = false
      material.polygonOffset = true
      material.polygonOffsetFactor = -2
      material.polygonOffsetUnits = -2
    }
  }, [span])

  return (
    <>
      <mesh name="preview-ground" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
        <planeGeometry args={[span, span]} />
        <meshStandardMaterial
          color="#e7eaf0"
          roughness={1}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
      </mesh>
      <gridHelper ref={gridRef} args={[span * 0.98, 16, '#c5cad3', '#dde1e8']} position={[0, -0.004, 0]} />
    </>
  )
}

export function FurniturePreviewScene({ layout, color, resetToken }: FurniturePreviewSceneProps) {
  const { width, depth, height } = layout.dimensions
  const span = Math.max(width, depth, 0.2) * 6
  return (
    <>
      <color attach="background" args={['#e4e7ee']} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[2.8, 5.2, 3.4]} intensity={0.55} />
      <directionalLight position={[-3, 2.4, -2]} intensity={0.22} />
      <PreviewFloor span={span} />
      <ContactShadows
        key={`${width.toPrecision(8)}-${depth.toPrecision(8)}-${height.toPrecision(8)}`}
        position={[0, -0.001, 0]}
        opacity={0.22}
        scale={Math.max(width, depth, 0.2) * 2.6}
        blur={2.6}
        far={Math.max(height * 1.4, 0.4)}
        resolution={256}
        frames={1}
        smooth
        color="#6a7280"
      />
      <FurnitureModel layout={layout} color={color} />
      <PreviewCameraRig extent={{ width, depth, height }} resetToken={resetToken} />
    </>
  )
}
