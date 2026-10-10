import type { FurnitureDimensions, FurniturePart } from '../../../types/furniture'
import { clamp } from '../../../utils/math'
import { collectParts, partFromExtents } from './parts'

/**
 * Modern bed: headboard at −Z, foot at +Z. Width/depth grow the sleeping
 * surface and frame; height is the headboard. Mattress and pillows stay
 * inside that outer box.
 */
export function bedParts({ width, depth, height }: FurnitureDimensions): FurniturePart[] | null {
  const halfW = width / 2
  const halfD = depth / 2
  const headD = clamp(depth * 0.035, 0.05, 0.08)
  const deckH = clamp(height * 0.3, 0.22, 0.32)
  const mattressH = clamp(height * 0.2, 0.14, 0.2)
  const rail = 0.03
  const inset = 0.025
  const pillowH = Math.min(0.11, height - deckH - mattressH - 0.02)
  const pillowD = clamp(depth * 0.14, 0.22, 0.3)
  const pillowW = (width - 2 * inset - 0.03) / 2

  const frame = [
    partFromExtents('headboard', -halfW, halfW, 0, height, -halfD, -halfD + headD, 'primary', 0.012),
    partFromExtents('platform', -halfW, halfW, 0, deckH - 0.02, -halfD + headD, halfD, 'secondary', 0.008),
    partFromExtents('left-rail', -halfW, -halfW + rail, 0, deckH, -halfD + headD, halfD, 'primary', 0.006),
    partFromExtents('right-rail', halfW - rail, halfW, 0, deckH, -halfD + headD, halfD, 'primary', 0.006),
    partFromExtents('foot-rail', -halfW, halfW, 0, deckH, halfD - rail, halfD, 'primary', 0.006),
  ]
  const mattress = partFromExtents(
    'mattress',
    -halfW + inset,
    halfW - inset,
    deckH - 0.02,
    deckH - 0.02 + mattressH,
    -halfD + headD + inset,
    halfD - inset,
    'accent',
    0.02,
  )
  const pillows =
    pillowH > 0.04 && pillowW > 0.2
      ? [
          partFromExtents(
            'pillow-left',
            -halfW + inset,
            -0.015,
            deckH - 0.02 + mattressH,
            deckH - 0.02 + mattressH + pillowH,
            -halfD + headD + inset + 0.02,
            -halfD + headD + inset + 0.02 + pillowD,
            'accent',
            0.04,
          ),
          partFromExtents(
            'pillow-right',
            0.015,
            halfW - inset,
            deckH - 0.02 + mattressH,
            deckH - 0.02 + mattressH + pillowH,
            -halfD + headD + inset + 0.02,
            -halfD + headD + inset + 0.02 + pillowD,
            'accent',
            0.04,
          ),
        ]
      : []

  return collectParts([...frame, mattress, ...pillows])
}
