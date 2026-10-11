import { useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, Vector2, type Group } from 'three'
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib'
import type { FurnitureInstance } from '../../../types/furniture'
import { getFurnitureFootprint } from '../../spatial/footprint'
import { warningOutlineKind, type SpatialValidation } from '../../spatial/spatialWarnings'

/** Just above the floor so the stroke does not z-fight with Y = 0. */
const WARNING_OUTLINE_Y = 0.02
const PIXEL_LINE_WIDTH = 2.5
const OUT_OF_BOUNDS_COLOR = '#dc2626'
const OVERLAP_COLOR = '#ea580c'

interface FurnitureWarningOutlinesProps {
  readonly instances: readonly FurnitureInstance[]
  readonly validation: SpatialValidation
}

function ignoreRaycast(): void {}

/**
 * Screen-space footprint stroke. Geometry is created inside the layout effect
 * so React Strict Mode can dispose and rebuild it without leaving a blank line.
 * Raycasting is disabled: the stroke must not take selection, drag, or placement.
 */
function FootprintOutline({
  positions,
  color,
}: {
  readonly positions: readonly number[]
  readonly color: string
}) {
  const groupRef = useRef<Group>(null)
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group || positions.length < 6) return
    const geometry = new LineGeometry()
    geometry.setPositions([...positions])
    const material = new LineMaterial({
      color: new Color(color).getHex(),
      linewidth: PIXEL_LINE_WIDTH,
      resolution: new Vector2(Math.max(width, 1), Math.max(height, 1)),
      depthTest: true,
      worldUnits: false,
    })
    material.toneMapped = false
    const line = new Line2(geometry, material)
    line.raycast = ignoreRaycast
    line.frustumCulled = false
    line.renderOrder = 2
    geometry.computeBoundingSphere()
    line.computeLineDistances()
    group.add(line)
    return () => {
      group.remove(line)
      geometry.dispose()
      material.dispose()
    }
  }, [color, height, positions, width])

  return <group ref={groupRef} />
}

/**
 * Closed rectangles derived from the same instance positions the meshes use.
 * Out of bounds is drawn in red and hides the orange overlap stroke.
 */
export function FurnitureWarningOutlines({ instances, validation }: FurnitureWarningOutlinesProps) {
  const outlines = useMemo(() => {
    const next: { id: string; color: string; positions: number[] }[] = []
    for (const instance of instances) {
      const kind = warningOutlineKind(validation, instance.id)
      if (!kind) continue
      const footprint = getFurnitureFootprint(instance)
      const first = footprint?.[0]
      if (!footprint || !first) continue
      const positions: number[] = []
      for (const point of footprint) {
        positions.push(point.x, WARNING_OUTLINE_Y, point.z)
      }
      positions.push(first.x, WARNING_OUTLINE_Y, first.z)
      next.push({
        id: instance.id,
        color: kind === 'out-of-bounds' ? OUT_OF_BOUNDS_COLOR : OVERLAP_COLOR,
        positions,
      })
    }
    return next
  }, [instances, validation])

  return (
    <group name="spatial-warning-outlines">
      {outlines.map((outline) => (
        <FootprintOutline key={outline.id} positions={outline.positions} color={outline.color} />
      ))}
    </group>
  )
}
