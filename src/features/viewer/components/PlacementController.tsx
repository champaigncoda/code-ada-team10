import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Raycaster, Vector2 } from 'three'
import type { FloorPoint } from '../../../types/room'
import { isPointInFloorPolygon, rayHitFloorY0 } from '../../furniture/placement/floorPlacement'

interface PlacementControllerProps {
  readonly active: boolean
  readonly footprint: readonly FloorPoint[]
  readonly onPreview: (position: FloorPoint | null) => void
  readonly onAttempt: (position: FloorPoint, inside: boolean) => void
}

/**
 * Tracks the pointer on the floor plane Y = 0. The placement ghost is not part
 * of this test — the ray never consults furniture or wall meshes.
 */
export function PlacementController({ active, footprint, onPreview, onAttempt }: PlacementControllerProps) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    if (!active) return
    const element = gl.domElement
    const raycaster = new Raycaster()
    const pointer = new Vector2()

    const hitFromEvent = (event: PointerEvent): FloorPoint | null => {
      const rect = element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return null
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const { origin, direction } = raycaster.ray
      return rayHitFloorY0(
        { x: origin.x, y: origin.y, z: origin.z },
        { x: direction.x, y: direction.y, z: direction.z },
      )
    }

    const onMove = (event: PointerEvent) => {
      const hit = hitFromEvent(event)
      onPreview(hit && isPointInFloorPolygon(hit, footprint) ? hit : null)
    }
    const onLeave = () => onPreview(null)
    const onUp = (event: PointerEvent) => {
      if (event.button !== 0) return
      const hit = hitFromEvent(event)
      if (!hit) {
        onPreview(null)
        return
      }
      const inside = isPointInFloorPolygon(hit, footprint)
      onPreview(inside ? hit : null)
      onAttempt(hit, inside)
    }

    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerleave', onLeave)
    element.addEventListener('pointerup', onUp)
    return () => {
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerleave', onLeave)
      element.removeEventListener('pointerup', onUp)
    }
  }, [active, camera, footprint, gl, onAttempt, onPreview])

  return null
}
