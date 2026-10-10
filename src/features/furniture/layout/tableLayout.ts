import type { FurnitureDimensions, FurniturePart } from '../../../types/furniture'
import { clamp } from '../../../utils/math'
import { collectParts, partFromExtents } from './parts'

/**
 * Rectangular table: tabletop reaches the full width, depth and height.
 * Legs stay a clamped thickness and track the corners as the top grows.
 */
export function tableParts({ width, depth, height }: FurnitureDimensions): FurniturePart[] | null {
  const halfW = width / 2
  const halfD = depth / 2
  const topH = clamp(height * 0.07, 0.028, 0.055)
  const leg = clamp(Math.min(width, depth) * 0.055, 0.04, 0.065)
  const inset = clamp(Math.min(width, depth) * 0.07, 0.04, 0.08)
  const top = partFromExtents('tabletop', -halfW, halfW, height - topH, height, -halfD, halfD, 'primary', 0.014)
  const legs = [
    partFromExtents('leg-front-left', -halfW + inset, -halfW + inset + leg, 0, height - topH, halfD - inset - leg, halfD - inset, 'secondary', 0.006),
    partFromExtents('leg-front-right', halfW - inset - leg, halfW - inset, 0, height - topH, halfD - inset - leg, halfD - inset, 'secondary', 0.006),
    partFromExtents('leg-back-left', -halfW + inset, -halfW + inset + leg, 0, height - topH, -halfD + inset, -halfD + inset + leg, 'secondary', 0.006),
    partFromExtents('leg-back-right', halfW - inset - leg, halfW - inset, 0, height - topH, -halfD + inset, -halfD + inset + leg, 'secondary', 0.006),
  ]
  return collectParts([top, ...legs])
}
