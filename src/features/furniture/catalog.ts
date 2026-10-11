import type { FurnitureCategory, FurnitureColor, FurnitureDimensions } from '../../types/furniture'

export const FURNITURE_CATEGORIES: readonly FurnitureCategory[] = ['sofa', 'bed', 'table', 'chair', 'cabinet']

export const FURNITURE_CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  sofa: 'Sofa',
  bed: 'Bed',
  table: 'Table',
  chair: 'Chair',
  cabinet: 'Cabinet',
}

/**
 * Suggested starting sizes in meters. Any finite positive size is accepted;
 * internal parts scale down when a dimension is too small for the usual
 * absolute proportions. There is no category maximum.
 */
export const FURNITURE_DEFAULTS: Record<FurnitureCategory, FurnitureDimensions> = {
  sofa: { width: 2, depth: 0.9, height: 0.85 },
  bed: { width: 1.6, depth: 2, height: 1 },
  table: { width: 1.2, depth: 0.7, height: 0.75 },
  chair: { width: 0.45, depth: 0.5, height: 0.85 },
  cabinet: { width: 0.8, depth: 0.45, height: 1 },
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

/** Chair swatches. The first entry is the category default. */
export const CHAIR_COLOR_PRESETS: readonly { readonly name: string; readonly value: FurnitureColor }[] = [
  { name: 'Birch', value: '#e3cba5' },
  { name: 'Black', value: '#2b2b2b' },
  { name: 'Mustard', value: '#c9a13b' },
  { name: 'Cognac Leather', value: '#9a5b34' },
  { name: 'Cream', value: '#f2ebdd' },
]

/** Cabinet swatches. The first entry is the category default. */
export const CABINET_COLOR_PRESETS: readonly { readonly name: string; readonly value: FurnitureColor }[] = [
  { name: 'White', value: '#f5f5f2' },
  { name: 'Light Oak', value: '#c8a97e' },
  { name: 'Walnut', value: '#6b4a2f' },
  { name: 'Black', value: '#2b2b2b' },
  { name: 'Gray Green', value: '#7d8f7a' },
]

/** Sofa, bed, and table share one list. Chair and cabinet have their own. */
export function colorPresetsFor(
  category: FurnitureCategory,
): readonly { readonly name: string; readonly value: FurnitureColor }[] {
  switch (category) {
    case 'sofa':
    case 'bed':
    case 'table':
      return FURNITURE_COLOR_PRESETS
    case 'chair':
      return CHAIR_COLOR_PRESETS
    case 'cabinet':
      return CABINET_COLOR_PRESETS
  }
}

/** First swatch for the category. Sofa, bed, and table stay on beige. */
export function defaultColorFor(category: FurnitureCategory): FurnitureColor {
  return colorPresetsFor(category)[0]?.value ?? DEFAULT_FURNITURE_COLOR
}

/** How closely the assembled parts must match the requested outer box. */
export const FURNITURE_BOUNDS_TOLERANCE = 1e-6
