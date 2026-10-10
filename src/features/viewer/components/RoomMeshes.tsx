import { useMemo } from 'react'
import { DoubleSide } from 'three'
import type { RoomGeometry } from '../../../types/room'
import { createFloorBufferGeometry, createWallsBufferGeometry } from '../geometry/meshGeometry'
import { FLOOR_COLOR, WALL_COLOR } from '../materials'

interface RoomMeshesProps {
  readonly geometry: RoomGeometry
  readonly showWalls: boolean
}

/** Floor and walls as two meshes. Hiding walls only flips `visible`; the geometry stays mounted. */
export function RoomMeshes({ geometry, showWalls }: RoomMeshesProps) {
  const floor = useMemo(
    () => createFloorBufferGeometry(geometry.footprint, geometry.floorTriangles),
    [geometry.footprint, geometry.floorTriangles],
  )
  const walls = useMemo(() => createWallsBufferGeometry(geometry.walls), [geometry.walls])

  return (
    <group name="room-meshes">
      <mesh name="room-floor" geometry={floor}>
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.9} metalness={0} side={DoubleSide} />
      </mesh>
      <mesh name="room-walls" geometry={walls} visible={showWalls}>
        <meshStandardMaterial color={WALL_COLOR} roughness={0.72} metalness={0} side={DoubleSide} />
      </mesh>
    </group>
  )
}
