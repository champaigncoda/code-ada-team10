import { RoundedBox } from '@react-three/drei'
import type { FurnitureLayout, FurniturePart } from '../../../types/furniture'
import { colorForRole, furniturePalette } from '../color'

interface FurnitureModelProps {
  readonly layout: FurnitureLayout
  readonly color: string
}

function PartMesh({ part, color }: { readonly part: FurniturePart; readonly color: string }) {
  const roughness = part.role === 'accent' ? 0.82 : part.role === 'secondary' ? 0.7 : 0.58
  return (
    <RoundedBox
      name={part.name}
      args={[part.size.x, part.size.y, part.size.z]}
      radius={part.radius}
      smoothness={4}
      position={[part.center.x, part.center.y, part.center.z]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.04} />
    </RoundedBox>
  )
}

/** Renders a layout. Color never affects part sizes — only materials. */
export function FurnitureModel({ layout, color }: FurnitureModelProps) {
  const palette = furniturePalette(color)
  return (
    <group name={`furniture-${layout.category}`}>
      {layout.parts.map((part) => (
        <PartMesh key={part.name} part={part} color={colorForRole(palette, part.role)} />
      ))}
    </group>
  )
}
