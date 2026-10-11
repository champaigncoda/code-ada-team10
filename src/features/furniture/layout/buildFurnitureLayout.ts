import type { FurnitureConfig, FurnitureDimensions, FurnitureLayout, FurniturePart } from '../../../types/furniture'
import { FURNITURE_BOUNDS_TOLERANCE } from '../catalog'
import { isFurnitureColor } from '../color'
import { bedParts } from './bedLayout'
import { cabinetParts } from './cabinetLayout'
import { chairParts } from './chairLayout'
import { layoutBounds } from './parts'
import { sofaParts } from './sofaLayout'
import { tableParts } from './tableLayout'

function hasBuildableDimensions(config: FurnitureConfig): boolean {
  const { width, depth, height } = config.dimensions
  return (
    Number.isFinite(width) &&
    Number.isFinite(depth) &&
    Number.isFinite(height) &&
    width > 0 &&
    depth > 0 &&
    height > 0 &&
    isFurnitureColor(config.color)
  )
}

/** Absolute tolerance for ordinary sizes, widened slightly for very large models. */
function dimensionTolerance(expected: number): number {
  return Math.max(FURNITURE_BOUNDS_TOLERANCE, Math.abs(expected) * 1e-6, 1e-9)
}

/** WebGL stores positions as float32. A part that collapses there is not a visible model. */
function survivesFloat32(part: FurniturePart): boolean {
  const separated = (min: number, max: number) => Math.fround(max) > Math.fround(min)
  return (
    separated(part.center.x - part.size.x / 2, part.center.x + part.size.x / 2) &&
    separated(part.center.y - part.size.y / 2, part.center.y + part.size.y / 2) &&
    separated(part.center.z - part.size.z / 2, part.center.z + part.size.z / 2)
  )
}

function partsFor(config: FurnitureConfig) {
  switch (config.category) {
    case 'sofa':
      return sofaParts(config.dimensions)
    case 'bed':
      return bedParts(config.dimensions)
    case 'table':
      return tableParts(config.dimensions)
    case 'chair':
      return chairParts(config.dimensions)
    case 'cabinet':
      return cabinetParts(config.dimensions)
  }
}

function matches(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= dimensionTolerance(expected)
}

/** Deterministic layout from a valid config. Returns null instead of throwing. */
export function buildFurnitureLayout(config: FurnitureConfig): FurnitureLayout | null {
  if (!hasBuildableDimensions(config)) return null
  const parts = partsFor(config)
  if (!parts || parts.some((part) => !survivesFloat32(part))) return null
  const bounds = layoutBounds(parts)
  if (!bounds) return null
  const { dimensions } = config
  if (!fitsRequestedBox(bounds, dimensions)) return null
  return { category: config.category, dimensions, parts }
}

function fitsRequestedBox(
  bounds: NonNullable<ReturnType<typeof layoutBounds>>,
  dimensions: FurnitureDimensions,
): boolean {
  const centerTolerance = dimensionTolerance(Math.max(dimensions.width, dimensions.depth))
  return (
    matches(bounds.minY, 0) &&
    matches(bounds.width, dimensions.width) &&
    matches(bounds.depth, dimensions.depth) &&
    matches(bounds.height, dimensions.height) &&
    Math.abs(bounds.minX + bounds.maxX) <= centerTolerance &&
    Math.abs(bounds.minZ + bounds.maxZ) <= centerTolerance
  )
}
