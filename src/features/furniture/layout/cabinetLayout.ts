import type { FurnitureDimensions, FurniturePart } from '../../../types/furniture'
import { collectParts, partFromExtents } from './parts'
import { featureSize } from './proportions'

/** Heights at or below this are dressers. Anything taller is a two-door wardrobe. */
const WARDROBE_MIN_HEIGHT = 1.2

/** About one drawer per 28 cm of overall height, and never fewer than two. */
const DRAWER_PITCH = 0.28

function drawerCount(height: number): number {
  return Math.max(2, Math.round(height / DRAWER_PITCH))
}

function stackRanges(minY: number, maxY: number, count: number): { minY: number; maxY: number }[] | null {
  const span = maxY - minY
  if (!(span > 0) || count < 1) return null
  const gap = Math.min(0.008, span * 0.015)
  const item = (span - gap * (count + 1)) / count
  if (!(item > 0)) return null
  return Array.from({ length: count }, (_, index) => {
    const start = minY + gap + index * (item + gap)
    return { minY: start, maxY: start + item }
  })
}

/**
 * Storage piece. A plinth and body fill the outer box. Fronts sit just proud
 * of the body and stop short of the front face so each handle can reach it
 * without growing the bounding box. Short cabinets get drawers; tall ones get
 * two doors.
 */
export function cabinetParts({ width, depth, height }: FurnitureDimensions): FurniturePart[] | null {
  const halfW = width / 2
  const halfD = depth / 2
  const plinthH = featureSize(height, 0.08, 0.02, 0.1, 0.18)
  const frontT = featureSize(depth, 0.045, 0.008, 0.02, 0.16)
  const sideInset = featureSize(width, 0.015, 0.003, 0.01, 0.06)
  const bodyH = height - plinthH
  if (!(plinthH > 0) || !(frontT > 0) || !(bodyH > 0) || !(frontT < depth)) return null

  const bury = Math.min(0.0015, frontT * 0.15, plinthH * 0.08)
  const handleStick = Math.min(0.006, frontT * 0.35)
  const bodyFront = halfD - frontT
  const frontZ0 = bodyFront - bury
  const frontZ1 = halfD - handleStick
  if (!(frontZ1 > frontZ0) || !(bodyFront > -halfD) || !(handleStick > 0)) return null

  const plinth = partFromExtents('plinth', -halfW, halfW, 0, plinthH, -halfD, bodyFront, 'secondary', Math.min(0.004, plinthH * 0.2))
  const body = partFromExtents(
    'body',
    -halfW,
    halfW,
    plinthH - bury,
    height,
    -halfD,
    bodyFront,
    'primary',
    Math.min(0.006, frontT * 0.25),
  )

  const panelMinX = -halfW + sideInset
  const panelMaxX = halfW - sideInset
  if (!(panelMaxX > panelMinX)) return null

  const fronts =
    height > WARDROBE_MIN_HEIGHT
      ? doorFronts(panelMinX, panelMaxX, plinthH, height, frontZ0, frontZ1, halfD, width)
      : drawerFronts(panelMinX, panelMaxX, plinthH, height, frontZ0, frontZ1, halfD)
  if (!fronts) return null
  return collectParts([plinth, body, ...fronts])
}

function drawerFronts(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  frontZ0: number,
  frontZ1: number,
  outerZ: number,
): (FurniturePart | null)[] | null {
  const bands = stackRanges(minY, maxY, drawerCount(maxY))
  if (!bands) return null
  const parts: (FurniturePart | null)[] = []
  for (const [index, band] of bands.entries()) {
    parts.push(
      partFromExtents(
        `drawer-${index + 1}`,
        minX,
        maxX,
        band.minY,
        band.maxY,
        frontZ0,
        frontZ1,
        'secondary',
        Math.min(0.004, (band.maxY - band.minY) * 0.15),
      ),
      frontHandle(
        `handle-drawer-${index + 1}`,
        (minX + maxX) / 2,
        (band.minY + band.maxY) / 2,
        minX,
        maxX,
        band.minY,
        band.maxY,
        frontZ1,
        outerZ,
      ),
    )
  }
  return parts
}

function doorFronts(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  frontZ0: number,
  frontZ1: number,
  outerZ: number,
  width: number,
): (FurniturePart | null)[] | null {
  const doorGap = featureSize(width, 0.012, 0.004, 0.01, 0.04)
  const leftMax = -doorGap / 2
  const rightMin = doorGap / 2
  if (!(leftMax > minX) || !(maxX > rightMin)) return null
  const band = stackRanges(minY, maxY, 1)?.[0]
  if (!band) return null
  const radius = Math.min(0.004, (band.maxY - band.minY) * 0.02)
  const leftSpan = leftMax - minX
  const rightSpan = maxX - rightMin
  return [
    partFromExtents('door-left', minX, leftMax, band.minY, band.maxY, frontZ0, frontZ1, 'secondary', radius),
    partFromExtents('door-right', rightMin, maxX, band.minY, band.maxY, frontZ0, frontZ1, 'secondary', radius),
    frontHandle(
      'handle-door-left',
      leftMax - Math.min(0.03, leftSpan * 0.18),
      (band.minY + band.maxY) / 2,
      minX,
      leftMax,
      band.minY,
      band.maxY,
      frontZ1,
      outerZ,
    ),
    frontHandle(
      'handle-door-right',
      rightMin + Math.min(0.03, rightSpan * 0.18),
      (band.minY + band.maxY) / 2,
      rightMin,
      maxX,
      band.minY,
      band.maxY,
      frontZ1,
      outerZ,
    ),
  ]
}

/** A pull whose outer face lands on the cabinet front and whose back is buried in the panel. */
function frontHandle(
  name: string,
  centerX: number,
  centerY: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  frontZ1: number,
  outerZ: number,
): FurniturePart | null {
  const panelWidth = maxX - minX
  const panelHeight = maxY - minY
  const handleW = Math.min(featureSize(panelWidth, 0.14, 0.01, 0.045, 0.28), panelWidth * 0.45)
  const handleH = Math.min(featureSize(panelHeight, 0.2, 0.008, 0.028, 0.4), panelHeight * 0.45)
  if (!(handleW > 0) || !(handleH > 0) || !(outerZ > frontZ1)) return null
  const halfW = handleW / 2
  const clampedX = Math.min(maxX - halfW, Math.max(minX + halfW, centerX))
  const buryIntoFront = Math.min(0.0015, (outerZ - frontZ1) * 0.25)
  return partFromExtents(
    name,
    clampedX - halfW,
    clampedX + halfW,
    centerY - handleH / 2,
    centerY + handleH / 2,
    frontZ1 - buryIntoFront,
    outerZ,
    'accent',
    Math.min(0.003, handleH * 0.25),
  )
}
