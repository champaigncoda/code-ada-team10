import type { FurnitureCategory, FurnitureCategoryLimits, FurnitureColor, FurnitureDimensions } from '../../types/furniture'

export const FURNITURE_CATEGORIES: readonly FurnitureCategory[] = ['sofa', 'bed', 'table']

export const FURNITURE_CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  sofa: 'Sofa',
  bed: 'Bed',
  table: 'Table',
}

/**
 * Inclusive size ranges in meters. They cover common retail furniture while
 * keeping every parametric part strictly positive at the extremes.
 */
export const FURNITURE_LIMITS: Record<FurnitureCategory, FurnitureCategoryLimits> = {
  sofa: {
    width: { min: 1.2, max: 3.5 },
    depth: { min: 0.7, max: 1.4 },
    height: { min: 0.65, max: 1.2 },
  },
  bed: {
    width: { min: 0.8, max: 2.2 },
    depth: { min: 1.6, max: 2.4 },
    height: { min: 0.7, max: 1.4 },
  },
  table: {
    width: { min: 0.6, max: 2.4 },
    depth: { min: 0.4, max: 1.4 },
    height: { min: 0.4, max: 1.1 },
  },
}

export const FURNITURE_DEFAULTS: Record<FurnitureCategory, FurnitureDimensions> = {
  sofa: { width: 2, depth: 0.9, height: 0.85 },
  bed: { width: 1.6, depth: 2, height: 1 },
  table: { width: 1.2, depth: 0.7, height: 0.75 },
}

export const DEFAULT_FURNITURE_CATEGORY: FurnitureCategory = 'sofa'

export const FURNITURE_COLOR_PRESETS: readonly { readonly name: string; readonly value: FurnitureColor }[] = [
  { name: 'Beige', value: '#d4c4a8' },
  { name: 'Gray', value: '#8b9099' },
  { name: 'Navy', value: '#2c3d5a' },
  { name: 'Olive', value: '#6b7c4f' },
  { name: 'Terracotta', value: '#c46b4a' },
  { name: 'White', value: '#f4f1ea' },
]

export const DEFAULT_FURNITURE_COLOR: FurnitureColor = '#d4c4a8'

/** How closely the assembled parts must match the requested outer box. */
export const FURNITURE_BOUNDS_TOLERANCE = 1e-6
