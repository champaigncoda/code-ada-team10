export interface GroundGridLayout {
  /** Side length of the square grid, in meters. */
  readonly size: number
  readonly divisions: number
  readonly cellSize: number
}

/** A grid about twice the room's footprint, in power-of-ten cells (roughly ten per room side). */
export function computeGroundGridLayout(width: number, depth: number): GroundGridLayout {
  const extent = Math.max(width, depth, Number.EPSILON)
  const cellSize = 10 ** Math.round(Math.log10(extent / 10))
  const divisions = Math.max(2, Math.ceil((extent * 2) / cellSize))
  return { size: divisions * cellSize, divisions, cellSize }
}
