import { useMemo } from 'react'
import { computeGroundGridLayout } from '../geometry/groundGrid'
import { GRID_CENTER_COLOR, GRID_LINE_COLOR } from '../materials'

interface GroundGridProps {
  readonly width: number
  readonly depth: number
}

export function GroundGrid({ width, depth }: GroundGridProps) {
  const layout = useMemo(() => computeGroundGridLayout(width, depth), [width, depth])
  return (
    <gridHelper
      name="ground-grid"
      args={[layout.size, layout.divisions, GRID_CENTER_COLOR, GRID_LINE_COLOR]}
      position={[0, -0.002, 0]}
    />
  )
}
