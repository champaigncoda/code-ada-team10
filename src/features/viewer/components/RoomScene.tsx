import { useCallback } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { FloorPoint, RoomGeometry } from '../../../types/room'
import { createFurnitureId } from '../../furniture/furnitureConfig'
import type { FurnitureSession, FurnitureSessionAction } from '../../furniture/session/furnitureSession'
import { orbitControlsEnabled } from '../../furniture/session/furnitureSession'
import { GroundGrid } from './GroundGrid'
import { PlacementController } from './PlacementController'
import { RoomCameraRig } from './RoomCameraRig'
import { RoomFurnitureLayer } from './RoomFurnitureLayer'
import { RoomMeshes } from './RoomMeshes'

interface RoomSceneProps {
  readonly geometry: RoomGeometry
  readonly showWalls: boolean
  readonly resetToken: number
  readonly session: FurnitureSession
  readonly onAction: (action: FurnitureSessionAction) => void
}

export function RoomScene({ geometry, showWalls, resetToken, session, onAction }: RoomSceneProps) {
  const { bounds, heightMeters, footprint } = geometry
  const placing = session.mode.kind === 'placement'
  const onPreview = useCallback((position: FloorPoint | null) => {
    onAction({ type: 'furniturePreviewMoved', position })
  }, [onAction])
  const onAttempt = useCallback((position: FloorPoint, inside: boolean) => {
    onAction({ type: 'furniturePlacementAttempted', position, inside, id: createFurnitureId() })
  }, [onAction])
  const onEmpty = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onAction({ type: 'furnitureDeselected' })
  }
  return (
    <>
      <color attach="background" args={['#e8eaef']} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[10, 14, 6]} intensity={1.05} />
      <directionalLight position={[-7, 6, -5]} intensity={0.28} />
      <group onClick={onEmpty}>
        <RoomMeshes geometry={geometry} showWalls={showWalls} />
      </group>
      <RoomFurnitureLayer session={session} onSelect={(id) => onAction({ type: 'furnitureSelected', id })} />
      <GroundGrid width={bounds.width} depth={bounds.depth} />
      <PlacementController
        active={placing}
        footprint={footprint}
        onPreview={onPreview}
        onAttempt={onAttempt}
      />
      <RoomCameraRig
        extent={{ width: bounds.width, depth: bounds.depth, height: heightMeters }}
        resetToken={resetToken}
        enabled={orbitControlsEnabled(session)}
      />
    </>
  )
}
