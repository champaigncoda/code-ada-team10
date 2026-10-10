import type { FurnitureConfig, FurnitureLayout } from '../../../types/furniture'
import { FURNITURE_BOUNDS_TOLERANCE, FURNITURE_LIMITS } from '../catalog'
import { isFurnitureColor } from '../color'
import { bedParts } from './bedLayout'
import { layoutBounds } from './parts'
import { sofaParts } from './sofaLayout'
import { tableParts } from './tableLayout'

function isWithinLimits(config: FurnitureConfig): boolean {
  const limits = FURNITURE_LIMITS[config.category]
  const { width, depth, height } = config.dimensions
  return (
    Number.isFinite(width) &&
    Number.isFinite(depth) &&
    Number.isFinite(height) &&
    width >= limits.width.min &&
    width <= limits.width.max &&
    depth >= limits.depth.min &&
    depth <= limits.depth.max &&
    height >= limits.height.min &&
    height <= limits.height.max &&
    isFurnitureColor(config.color)
  )
}

function partsFor(config: FurnitureConfig) {
  if (config.category === 'sofa') return sofaParts(config.dimensions)
  if (config.category === 'bed') return bedParts(config.dimensions)
  return tableParts(config.dimensions)
}

/**
 * Deterministic layout from a valid config. Returns null instead of throwing
 * so a stale or mid-edit input never breaks the preview.
 */
export function buildFurnitureLayout(config: FurnitureConfig): FurnitureLayout | null {
  if (!isWithinLimits(config)) return null
  const parts = partsFor(config)
  if (!parts) return null
  const bounds = layoutBounds(parts)
  if (!bounds) return null
  const { dimensions } = config
  if (Math.abs(bounds.minY) > FURNITURE_BOUNDS_TOLERANCE) return null
  if (Math.abs(bounds.width - dimensions.width) > FURNITURE_BOUNDS_TOLERANCE) return null
  if (Math.abs(bounds.depth - dimensions.depth) > FURNITURE_BOUNDS_TOLERANCE) return null
  if (Math.abs(bounds.height - dimensions.height) > FURNITURE_BOUNDS_TOLERANCE) return null
  if (Math.abs(bounds.minX + bounds.maxX) > FURNITURE_BOUNDS_TOLERANCE) return null
  if (Math.abs(bounds.minZ + bounds.maxZ) > FURNITURE_BOUNDS_TOLERANCE) return null
  return { category: config.category, dimensions, parts }
}
