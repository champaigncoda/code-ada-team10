import type { FurnitureDimensions, FurniturePart } from '../../../types/furniture'
import { clamp } from '../../../utils/math'
import { collectParts, partFromExtents } from './parts'

/**
 * Modern sofa: arms on +/−X, backrest at −Z, seat facing +Z.
 * Width grows the seat and backrest; arm thickness is clamped.
 * Depth grows the seat; backrest thickness is clamped.
 * Height is the backrest top; the seat stays in a usable mid range.
 */
export function sofaParts({ width, depth, height }: FurnitureDimensions): FurniturePart[] | null {
  const halfW = width / 2
  const halfD = depth / 2
  const armW = clamp(width * 0.07, 0.09, 0.13)
  const backD = clamp(depth * 0.2, 0.11, 0.16)
  const seatH = clamp(height * 0.5, 0.34, 0.46)
  const cushionH = clamp(seatH * 0.26, 0.07, 0.12)
  const baseH = seatH - cushionH
  const armH = clamp(height * 0.82, seatH + 0.05, height * 0.9)
  const seatW = width - 2 * armW
  const seatD = depth - backD
  const cushionCount = seatW >= 1.6 ? 3 : 2
  const gap = 0.012
  const cushionW = (seatW - gap * (cushionCount - 1)) / cushionCount
  const cushionInset = 0.012
  const cushionD = seatD - cushionInset * 2

  const arms = [
    partFromExtents('left-arm', -halfW, -halfW + armW, 0, armH, -halfD, halfD, 'secondary', 0.03),
    partFromExtents('right-arm', halfW - armW, halfW, 0, armH, -halfD, halfD, 'secondary', 0.03),
  ]
  const structure = [
    partFromExtents('backrest', -halfW + armW, halfW - armW, 0, height, -halfD, -halfD + backD, 'primary', 0.025),
    partFromExtents('seat-base', -halfW + armW, halfW - armW, 0, baseH, -halfD + backD, halfD, 'secondary', 0.012),
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
      0.028,
    )
  })

  if (cushionW <= 0 || cushionD <= 0) return null
  return collectParts([...arms, ...structure, ...cushions])
}
