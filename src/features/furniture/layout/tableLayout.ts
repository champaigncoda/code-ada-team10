import type { FurnitureDimensions, FurniturePart } from '../../../types/furniture'
import { collectParts, partFromExtents } from './parts'
import { featureSize } from './proportions'

/**
 * Rectangular table: tabletop reaches the full width, depth, and height.
 * Legs stay a clamped thickness and track the corners as the top grows.
 * On a very small top the legs and inset shrink so they remain inside the footprint.
 */
export function tableParts({ width, depth, height }: FurnitureDimensions): FurniturePart[] | null {
  const halfW = width / 2
  const halfD = depth / 2
  const span = Math.min(width, depth)
  const topH = featureSize(height, 0.07, 0.028, 0.055, 0.22)
  const leg = featureSize(span, 0.055, 0.04, 0.065, 0.16)
  const inset = featureSize(span, 0.07, 0.04, 0.08, 0.2)
  const legH = height - topH
  if (!(topH > 0) || !(leg > 0) || !(inset > 0) || !(legH > 0)) return null
  if (2 * (inset + leg) > span) return null

  const top = partFromExtents(
    'tabletop',
    -halfW,
    halfW,
    height - topH,
    height,
    -halfD,
    halfD,
    'primary',
    Math.min(0.014, topH * 0.35),
  )
  const legs = [
    partFromExtents('leg-front-left', -halfW + inset, -halfW + inset + leg, 0, height - topH, halfD - inset - leg, halfD - inset, 'secondary', Math.min(0.006, leg * 0.2)),
    partFromExtents('leg-front-right', halfW - inset - leg, halfW - inset, 0, height - topH, halfD - inset - leg, halfD - inset, 'secondary', Math.min(0.006, leg * 0.2)),
    partFromExtents('leg-back-left', -halfW + inset, -halfW + inset + leg, 0, height - topH, -halfD + inset, -halfD + inset + leg, 'secondary', Math.min(0.006, leg * 0.2)),
    partFromExtents('leg-back-right', halfW - inset - leg, halfW - inset, 0, height - topH, -halfD + inset, -halfD + inset + leg, 'secondary', Math.min(0.006, leg * 0.2)),
  ]
  return collectParts([top, ...legs])
}
