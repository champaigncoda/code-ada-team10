import type { FurnitureDimensions, FurniturePart } from '../../../types/furniture'
import { clamp } from '../../../utils/math'
import { collectParts, partFromExtents } from './parts'
import { featureSize } from './proportions'

/** Keep a wide sofa recognizable without creating dozens of meshes. */
function sofaCushionCount(seatW: number): number {
  if (seatW < 1.6) return 2
  return Math.min(8, Math.max(3, Math.round(seatW / 0.58)))
}

/**
 * Modern sofa: arms on +/−X, backrest at −Z, seat facing +Z.
 * Width grows the seat and backrest; arm thickness stays in a small range.
 * Depth grows the seat; backrest thickness stays in a small range.
 * Height is the backrest top; the seat stays in a usable mid range.
 * Very small sofas use the same proportions, scaled down so every part stays positive.
 */
export function sofaParts({ width, depth, height }: FurnitureDimensions): FurniturePart[] | null {
  const halfW = width / 2
  const halfD = depth / 2
  const armW = featureSize(width, 0.07, 0.09, 0.13, 0.22)
  const backD = featureSize(depth, 0.2, 0.11, 0.16, 0.35)
  const seatH = featureSize(height, 0.5, 0.34, 0.46, 0.62)
  const cushionH = featureSize(seatH, 0.26, 0.07, 0.12, 0.4)
  const baseH = seatH - cushionH
  const riseRoom = Math.max(height - seatH, 0)
  const armLift = Math.min(0.05, riseRoom * 0.35)
  const armH = clamp(height * 0.82, Math.min(seatH + armLift, height * 0.9), height * 0.9)
  const seatW = width - 2 * armW
  const seatD = depth - backD
  const cushionCount = sofaCushionCount(seatW)
  const gap = Math.min(0.012, seatW * 0.02)
  const cushionW = (seatW - gap * (cushionCount - 1)) / cushionCount
  const cushionInset = Math.min(0.012, seatD * 0.08)
  const cushionD = seatD - cushionInset * 2

  const arms = [
    partFromExtents('left-arm', -halfW, -halfW + armW, 0, armH, -halfD, halfD, 'secondary', Math.min(0.03, armW * 0.35)),
    partFromExtents('right-arm', halfW - armW, halfW, 0, armH, -halfD, halfD, 'secondary', Math.min(0.03, armW * 0.35)),
  ]
  const structure = [
    partFromExtents('backrest', -halfW + armW, halfW - armW, 0, height, -halfD, -halfD + backD, 'primary', Math.min(0.025, backD * 0.3)),
    partFromExtents('seat-base', -halfW + armW, halfW - armW, 0, baseH, -halfD + backD, halfD, 'secondary', Math.min(0.012, baseH * 0.2)),
  ]
  const cushions = Array.from({ length: cushionCount }, (_, index) => {
    const minX = -halfW + armW + index * (cushionW + gap)
    return partFromExtents(
      `seat-cushion-${index + 1}`,
      minX,
      minX + cushionW,
      baseH,
      baseH + cushionH,
      -halfD + backD + cushionInset,
      halfD - cushionInset,
      'accent',
      Math.min(0.028, cushionH * 0.35),
    )
  })

  if (!(cushionW > 0) || !(cushionD > 0) || !(baseH > 0) || !(armH > 0)) return null
  return collectParts([...arms, ...structure, ...cushions])
}
