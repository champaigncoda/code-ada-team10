import { useMemo } from 'react'
import { DoubleSide } from 'three'
import type { RoomAppearance, RoomGeometry } from '../../../types/room'
import { createFloorBufferGeometry, createWallsBufferGeometry } from '../geometry/meshGeometry'

interface RoomMeshesProps {
  readonly geometry: RoomGeometry
  readonly showWalls: boolean
  readonly appearance: RoomAppearance
}

/**
 * Floor and walls as two meshes. Hiding walls only flips `visible`, and a new
 * color only updates the material; the geometry stays mounted either way.
 */
export function RoomMeshes({ geometry, showWalls, appearance }: RoomMeshesProps) {
  const floor = useMemo(
    () => createFloorBufferGeometry(geometry.footprint, geometry.floorTriangles),
    [geometry.footprint, geometry.floorTriangles],
  )
  const walls = useMemo(() => createWallsBufferGeometry(geometry.walls), [geometry.walls])

  return (
    <group name="room-meshes">
      <mesh name="room-floor" geometry={floor}>
        <meshStandardMaterial color={appearance.floorColor} roughness={0.9} metalness={0} side={DoubleSide} />
      </mesh>
      <mesh name="room-walls" geometry={walls} visible={showWalls}>
        <meshStandardMaterial color={appearance.wallColor} roughness={0.72} metalness={0} side={DoubleSide} />
      </mesh>
    </group>
  )
}
