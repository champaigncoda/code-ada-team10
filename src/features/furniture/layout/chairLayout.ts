import type { FurnitureDimensions, FurniturePart } from '../../../types/furniture'
import { collectParts, partFromExtents } from './parts'
import { featureSize } from './proportions'

/**
 * Side chair: seat facing +Z, backrest at −Z, four legs down to the floor.
 * The seat top stays near 45 cm and scales down when the chair is short.
 * The seat spans the width and almost the full depth, so the outer box
 * matches the requested size. Legs and the backrest supply the floor and the top.
 */
export function chairParts({ width, depth, height }: FurnitureDimensions): FurniturePart[] | null {
  const halfW = width / 2
  const halfD = depth / 2
  const span = Math.min(width, depth)
  const seatTop = featureSize(height, 0.45 / 0.85, 0.22, 0.48, 0.72)
  const seatH = featureSize(seatTop, 0.12, 0.018, 0.06, 0.4)
  const leg = featureSize(span, 0.08, 0.018, 0.045, 0.22)
  const backD = featureSize(depth, 0.08, 0.012, 0.045, 0.28)
  const seatBottom = seatTop - seatH
  if (!(seatBottom > 0) || !(backD > 0) || !(leg > 0) || !(seatTop < height)) return null
  if (2 * leg >= width || 2 * leg >= depth || backD >= depth) return null

  const seatBackInset = Math.min(0.0008, backD * 0.05)
  const backSink = Math.min(0.001, seatH * 0.05)
  const legRadius = Math.min(0.004, leg * 0.2)
  const legs = [
    partFromExtents('leg-front-left', -halfW, -halfW + leg, 0, seatBottom, halfD - leg, halfD, 'secondary', legRadius),
    partFromExtents('leg-front-right', halfW - leg, halfW, 0, seatBottom, halfD - leg, halfD, 'secondary', legRadius),
    partFromExtents('leg-back-left', -halfW, -halfW + leg, 0, seatBottom, -halfD, -halfD + leg, 'secondary', legRadius),
    partFromExtents('leg-back-right', halfW - leg, halfW, 0, seatBottom, -halfD, -halfD + leg, 'secondary', legRadius),
  ]
  const seat = partFromExtents(
    'seat',
    -halfW,
    halfW,
    seatBottom,
    seatTop,
    -halfD + seatBackInset,
    halfD,
    'primary',
    Math.min(0.01, seatH * 0.3),
  )
  const backrest = partFromExtents(
    'backrest',
    -halfW,
    halfW,
    seatTop - backSink,
    height,
    -halfD,
    -halfD + backD,
    'secondary',
    Math.min(0.008, backD * 0.3),
  )
  return collectParts([...legs, seat, backrest])
}
