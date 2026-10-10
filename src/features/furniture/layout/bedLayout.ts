import type { FurnitureDimensions, FurniturePart } from '../../../types/furniture'
import { collectParts, partFromExtents } from './parts'
import { featureSize } from './proportions'

/**
 * Modern bed: headboard at −Z, foot at +Z.
 *
 * The frame is a shell of non-overlapping boxes. The platform sits inside that
 * shell and is buried a fraction of a millimetre into the rails so its faces
 * are not coplanar with the visible side, foot, or headboard. The mattress and
 * pillows are sunk slightly into the surface under them for the same reason.
 * Width, depth, and height remain the outer bounding box, with the bottom at Y = 0.
 */
export function bedParts({ width, depth, height }: FurnitureDimensions): FurniturePart[] | null {
  const halfW = width / 2
  const halfD = depth / 2
  const headD = featureSize(depth, 0.035, 0.05, 0.08, 0.18)
  const deckH = featureSize(height, 0.3, 0.22, 0.32, 0.42)
  const mattressH = featureSize(height, 0.2, 0.14, 0.22, 0.3)
  const span = Math.min(width, depth)
  const rail = featureSize(span, 0.01875, 0.03, 0.05, 0.12)
  const lip = Math.min(0.02, deckH * 0.12)
  const deckTop = deckH - lip
  const innerW = width - 2 * rail
  const innerD = depth - headD - rail
  if (!(headD > 0) || !(rail > 0) || !(deckTop > 0) || !(mattressH > 0) || !(innerW > 0) || !(innerD > 0)) {
    return null
  }
  if (deckTop + mattressH >= height) return null

  const bury = Math.min(0.0015, rail * 0.15, headD * 0.15, deckTop * 0.08)
  const sink = Math.min(0.003, mattressH * 0.05, lip * 0.4, deckTop * 0.2)
  const mattressInset = Math.min(0.012, innerW * 0.04, innerD * 0.04)

  const headZ = -halfD + headD
  const footZ = halfD - rail
  const frame = [
    partFromExtents('headboard', -halfW, halfW, 0, height, -halfD, headZ, 'primary', Math.min(0.012, headD * 0.3)),
    partFromExtents('left-rail', -halfW, -halfW + rail, 0, deckH, headZ, footZ, 'primary', Math.min(0.006, rail * 0.3)),
    partFromExtents('right-rail', halfW - rail, halfW, 0, deckH, headZ, footZ, 'primary', Math.min(0.006, rail * 0.3)),
    partFromExtents('foot-rail', -halfW, halfW, 0, deckH, footZ, halfD, 'primary', Math.min(0.006, rail * 0.3)),
    partFromExtents(
      'platform',
      -halfW + rail - bury,
      halfW - rail + bury,
      bury,
      deckTop,
      headZ - bury,
      footZ + bury,
      'secondary',
      Math.min(0.008, deckTop * 0.15),
    ),
  ]

  const mattress = partFromExtents(
    'mattress',
    -halfW + rail + mattressInset,
    halfW - rail - mattressInset,
    deckTop - sink,
    deckTop - sink + mattressH,
    headZ + mattressInset,
    footZ - mattressInset,
    'accent',
    Math.min(0.02, mattressH * 0.2),
  )

  const mattressTop = deckTop - sink + mattressH
  const pillowH = Math.min(featureSize(height, 0.11, 0.06, 0.12, 0.18), height - mattressTop)
  const pillowD = featureSize(innerD, 0.16, 0.22, 0.32, 0.34)
  const pillowGap = Math.min(0.03, innerW * 0.04)
  const pillowW = (innerW - 2 * mattressInset - pillowGap) / 2
  const pillowSink = Math.min(0.004, pillowH * 0.08)
  const pillowZ0 = headZ + mattressInset + Math.min(0.02, innerD * 0.02)
  const pillowZ1 = Math.min(pillowZ0 + pillowD, footZ - mattressInset)
  const pillows =
    pillowH > 0.03 && pillowW > 0.04 && pillowZ1 - pillowZ0 > 0.02 && mattressTop + pillowH - pillowSink <= height + 1e-9
      ? [
          partFromExtents(
            'pillow-left',
            -halfW + rail + mattressInset,
            -pillowGap / 2,
            mattressTop - pillowSink,
            mattressTop - pillowSink + pillowH,
            pillowZ0,
            pillowZ1,
            'accent',
            Math.min(0.04, pillowH * 0.35),
          ),
          partFromExtents(
            'pillow-right',
            pillowGap / 2,
            halfW - rail - mattressInset,
            mattressTop - pillowSink,
            mattressTop - pillowSink + pillowH,
            pillowZ0,
            pillowZ1,
            'accent',
            Math.min(0.04, pillowH * 0.35),
          ),
        ]
      : []

  return collectParts([...frame, mattress, ...pillows])
}
