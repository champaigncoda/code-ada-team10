import type { RoomGeometry } from '../../../types/room'
import { GroundGrid } from './GroundGrid'
import { RoomCameraRig } from './RoomCameraRig'
import { RoomMeshes } from './RoomMeshes'

interface RoomSceneProps {
  readonly geometry: RoomGeometry
  readonly showWalls: boolean
  readonly resetToken: number
}

export function RoomScene({ geometry, showWalls, resetToken }: RoomSceneProps) {
  const { bounds, heightMeters } = geometry
  return (
    <>
      <color attach="background" args={['#e8eaef']} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[10, 14, 6]} intensity={1.05} />
      <directionalLight position={[-7, 6, -5]} intensity={0.28} />
      <RoomMeshes geometry={geometry} showWalls={showWalls} />
      <GroundGrid width={bounds.width} depth={bounds.depth} />
      <RoomCameraRig
        extent={{ width: bounds.width, depth: bounds.depth, height: heightMeters }}
        resetToken={resetToken}
      />
    </>
  )
}
