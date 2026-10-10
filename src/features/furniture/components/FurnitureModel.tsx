import { RoundedBox } from '@react-three/drei'
import type { FurnitureLayout, FurniturePart } from '../../../types/furniture'
import { colorForRole, furniturePalette } from '../color'

interface FurnitureModelProps {
  readonly layout: FurnitureLayout
  readonly color: string
  /** Draws a highlight without changing the stored furniture color. */
  readonly highlighted?: boolean
  /** Placement ghost. Excluded from pointer hit testing. */
  readonly ghost?: boolean
}

function ignoreRaycast(): void {}

function PartMesh({
  part,
  color,
  highlighted = false,
  ghost = false,
}: {
  readonly part: FurniturePart
  readonly color: string
  readonly highlighted?: boolean
  readonly ghost?: boolean
}) {
  const roughness = part.role === 'accent' ? 0.82 : part.role === 'secondary' ? 0.7 : 0.58
  return (
    <RoundedBox
      name={part.name}
      args={[part.size.x, part.size.y, part.size.z]}
      radius={part.radius}
      smoothness={4}
      position={[part.center.x, part.center.y, part.center.z]}
      castShadow={!ghost}
      receiveShadow={!ghost}
      raycast={ghost ? ignoreRaycast : undefined}
    >
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={0.04}
        emissive={highlighted ? '#2457d6' : '#000000'}
        emissiveIntensity={highlighted ? 0.28 : 0}
        transparent={ghost}
        opacity={ghost ? 0.45 : 1}
        depthWrite={!ghost}
      />
    </RoundedBox>
  )
}

/** Renders a layout. Color never affects part sizes — only materials. */
export function FurnitureModel({ layout, color, highlighted = false, ghost = false }: FurnitureModelProps) {
  const palette = furniturePalette(color)
  return (
    <group name={`furniture-${layout.category}`}>
      {layout.parts.map((part) => (
        <PartMesh
          key={part.name}
          part={part}
          color={colorForRole(palette, part.role)}
          highlighted={highlighted}
          ghost={ghost}
        />
      ))}
    </group>
  )
}
