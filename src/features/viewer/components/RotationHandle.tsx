import { useMemo } from 'react'
import { DoubleSide } from 'three'
import type { FurnitureInstance } from '../../../types/furniture'

const ARC_RADIANS = (120 * Math.PI) / 180
const HANDLE_COLOR = '#2563eb'

interface RotationHandleProps {
  readonly instance: FurnitureInstance
}

/** A floor-level arc and grab point around the selected item's footprint. */
export function RotationHandle({ instance }: RotationHandleProps) {
  const radius = useMemo(
    () => Math.hypot(instance.dimensions.width, instance.dimensions.depth) / 2 + 0.18,
    [instance.dimensions.width, instance.dimensions.depth],
  )
  const handle = {
    x: Math.cos(ARC_RADIANS) * radius,
    z: Math.sin(ARC_RADIANS) * radius,
  }
  const tangent = { x: -Math.sin(ARC_RADIANS), z: Math.cos(ARC_RADIANS) }
  const userData = { furniturePart: 'rotate' as const, furnitureId: instance.id }

  return (
    <group
      name={`rotate-${instance.id}`}
      position={[instance.position.x, 0.05, instance.position.z]}
      rotation={[0, instance.rotationY, 0]}
      userData={userData}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]} userData={userData} renderOrder={2}>
        <torusGeometry args={[radius, 0.02, 8, 40, ARC_RADIANS]} />
        <meshBasicMaterial color={HANDLE_COLOR} side={DoubleSide} depthTest />
      </mesh>
      <mesh position={[handle.x, 0, handle.z]} userData={userData} renderOrder={3}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshBasicMaterial color={HANDLE_COLOR} depthTest />
      </mesh>
      <mesh
        position={[handle.x + tangent.x * 0.14, 0, handle.z + tangent.z * 0.14]}
        rotation={[Math.PI / 2, 0, Math.atan2(tangent.x, tangent.z)]}
        userData={userData}
        renderOrder={3}
      >
        <coneGeometry args={[0.055, 0.16, 10]} />
        <meshBasicMaterial color={HANDLE_COLOR} depthTest />
      </mesh>
    </group>
  )
}
