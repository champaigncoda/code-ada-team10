import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { FurnitureInstance } from '../../../types/furniture'
import { FurnitureModel } from '../../furniture/components/FurnitureModel'
import { parseFurnitureDraft } from '../../furniture/furnitureConfig'
import { buildFurnitureLayout } from '../../furniture/layout/buildFurnitureLayout'
import type { FurnitureSession } from '../../furniture/session/furnitureSession'

interface RoomFurnitureLayerProps {
  readonly session: FurnitureSession
  readonly onSelect: (id: string) => void
}

export function RoomFurnitureLayer({ session, onSelect }: RoomFurnitureLayerProps) {
  const mode = session.mode
  const placing = mode.kind === 'placement'
  const selectedId = mode.kind === 'edit' ? mode.selectedId : null
  const placementDraft = mode.kind === 'placement' ? mode.draft : null
  const previewLayout = useMemo(() => {
    if (!placementDraft) return null
    const parsed = parseFurnitureDraft(placementDraft)
    return parsed ? buildFurnitureLayout(parsed) : null
  }, [placementDraft])

  return (
    <group name="placed-furniture">
      {session.instances.map((instance) => (
        <PlacedFurniture
          key={instance.id}
          instance={instance}
          highlighted={instance.id === selectedId}
          selectable={!placing}
          onSelect={onSelect}
        />
      ))}
      {mode.kind === 'placement' && mode.preview && previewLayout && (
        <group name="placement-preview" position={[mode.preview.x, 0, mode.preview.z]}>
          <FurnitureModel layout={previewLayout} color={mode.draft.color} ghost />
        </group>
      )}
    </group>
  )
}

function PlacedFurniture({
  instance,
  highlighted,
  selectable,
  onSelect,
}: {
  readonly instance: FurnitureInstance
  readonly highlighted: boolean
  readonly selectable: boolean
  readonly onSelect: (id: string) => void
}) {
  const layout = useMemo(
    () =>
      buildFurnitureLayout({
        id: instance.id,
        category: instance.category,
        dimensions: instance.dimensions,
        color: instance.color,
      }),
    [instance],
  )
  if (!layout) return null
  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(instance.id)
  }
  return (
    <group
      name={`placed-${instance.id}`}
      position={[instance.position.x, 0, instance.position.z]}
      rotation={[0, instance.rotationY, 0]}
      onClick={selectable ? select : undefined}
    >
      <FurnitureModel layout={layout} color={instance.color} highlighted={highlighted} />
    </group>
  )
}
