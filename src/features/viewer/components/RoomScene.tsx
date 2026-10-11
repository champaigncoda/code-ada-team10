import { useCallback } from 'react'
import type { FloorPoint, RoomGeometry } from '../../../types/room'
import { createFurnitureId } from '../../furniture/furnitureConfig'
import type { FurnitureSession, FurnitureSessionAction } from '../../furniture/session/furnitureSession'
import { orbitControlsEnabled } from '../../furniture/session/furnitureSession'
import type { SpatialValidation } from '../../spatial/spatialWarnings'
import { FurnitureGestureController } from './FurnitureGestureController'
import { FurnitureWarningOutlines } from './FurnitureWarningOutlines'
import { GroundGrid } from './GroundGrid'
import { PlacementController } from './PlacementController'
import { RoomCameraRig } from './RoomCameraRig'
import { RoomFurnitureLayer } from './RoomFurnitureLayer'
import { RoomMeshes } from './RoomMeshes'

interface RoomSceneProps {
  readonly geometry: RoomGeometry
  readonly showWalls: boolean
  readonly resetToken: number
  readonly topToken: number
  readonly session: FurnitureSession
  readonly validation: SpatialValidation
  readonly onAction: (action: FurnitureSessionAction) => void
}

export function RoomScene({ geometry, showWalls, resetToken, topToken, session, validation, onAction }: RoomSceneProps) {
  const { bounds, heightMeters, footprint } = geometry
  const placing = session.mode.kind === 'placement'
  const onPreview = useCallback((position: FloorPoint | null) => {
    onAction({ type: 'furniturePreviewMoved', position })
  }, [onAction])
  const onAttempt = useCallback((position: FloorPoint, inside: boolean) => {
    onAction({ type: 'furniturePlacementAttempted', position, inside, id: createFurnitureId() })
  }, [onAction])
  return (
    <>
      <color attach="background" args={['#e8eaef']} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[10, 14, 6]} intensity={1.05} />
      <directionalLight position={[-7, 6, -5]} intensity={0.28} />
      <RoomMeshes geometry={geometry} showWalls={showWalls} />
      <RoomFurnitureLayer session={session} onSelect={(id) => onAction({ type: 'furnitureSelected', id })} />
      <FurnitureWarningOutlines instances={session.instances} validation={validation} />
      <GroundGrid width={bounds.width} depth={bounds.depth} />
      <PlacementController
        active={placing}
        footprint={footprint}
        onPreview={onPreview}
        onAttempt={onAttempt}
      />
      <FurnitureGestureController
        placing={placing}
        instances={session.instances}
        onSelect={(id) => onAction({ type: 'furnitureSelected', id })}
        onMove={(id, x, z) => onAction({ type: 'furnitureMoved', id, x, z })}
        onRotate={(id, rotationY) => onAction({ type: 'furnitureRotated', id, rotationY })}
        onEmptyClick={() => onAction({ type: 'furnitureDeselected' })}
      />
      <RoomCameraRig
        extent={{ width: bounds.width, depth: bounds.depth, height: heightMeters }}
        floorBounds={bounds}
        resetToken={resetToken}
        topToken={topToken}
        enabled={orbitControlsEnabled(session)}
      />
    </>
  )
}
