import type {
  FurnitureCategory,
  FurnitureColor,
  FurnitureConfig,
  FurnitureDimensionAxis,
  FurnitureDimensions,
} from '../../types/furniture'
import { parsePositiveMeters } from '../../utils/parsePositiveMeters'
import {
  DEFAULT_FURNITURE_CATEGORY,
  DEFAULT_FURNITURE_COLOR,
  FURNITURE_DEFAULTS,
  FURNITURE_LIMITS,
} from './catalog'
import { normalizeFurnitureColor } from './color'

export interface FurnitureDraft {
  readonly category: FurnitureCategory
  readonly widthInput: string
  readonly depthInput: string
  readonly heightInput: string
  readonly color: FurnitureColor
}

export type FurnitureDimensionParseResult =
  | { readonly ok: true; readonly meters: number }
  | { readonly ok: false; readonly message: string }

const AXIS_LABEL: Record<FurnitureDimensionAxis, string> = {
  width: 'width',
  depth: 'depth',
  height: 'height',
}

export function formatLimit(meters: number): string {
  return meters.toFixed(2)
}

export function createFurnitureId(): string {
  return `furn-${crypto.randomUUID()}`
}

export function draftFromDefaults(
  category: FurnitureCategory = DEFAULT_FURNITURE_CATEGORY,
  color: FurnitureColor = DEFAULT_FURNITURE_COLOR,
): FurnitureDraft {
  const defaults = FURNITURE_DEFAULTS[category]
  return {
    category,
    widthInput: String(defaults.width),
    depthInput: String(defaults.depth),
    heightInput: String(defaults.height),
    color: normalizeFurnitureColor(color) ?? DEFAULT_FURNITURE_COLOR,
  }
}

export function changeFurnitureCategory(draft: FurnitureDraft, category: FurnitureCategory): FurnitureDraft {
  if (draft.category === category) return draft
  return draftFromDefaults(category, draft.color)
}

export function changeFurnitureDimension(
  draft: FurnitureDraft,
  axis: FurnitureDimensionAxis,
  input: string,
): FurnitureDraft {
  if (axis === 'width') return { ...draft, widthInput: input }
  if (axis === 'depth') return { ...draft, depthInput: input }
  return { ...draft, heightInput: input }
}

export function changeFurnitureColor(draft: FurnitureDraft, color: string): FurnitureDraft {
  const normalized = normalizeFurnitureColor(color)
  return normalized ? { ...draft, color: normalized } : draft
}

export function parseFurnitureDimension(
  input: string,
  category: FurnitureCategory,
  axis: FurnitureDimensionAxis,
): FurnitureDimensionParseResult {
  const limits = FURNITURE_LIMITS[category][axis]
  const parsed = parsePositiveMeters(input, {
    empty: `Enter the ${AXIS_LABEL[axis]} in meters.`,
    example: String(FURNITURE_DEFAULTS[category][axis]),
    nonPositive: `The ${AXIS_LABEL[axis]} must be greater than zero.`,
  })
  if (!parsed.ok) return parsed
  if (parsed.meters < limits.min || parsed.meters > limits.max) {
    return {
      ok: false,
      message: `${category[0]?.toUpperCase() ?? ''}${category.slice(1)} ${AXIS_LABEL[axis]} must be between ${formatLimit(limits.min)} m and ${formatLimit(limits.max)} m.`,
    }
  }
  return parsed
}

export function parseFurnitureDraft(draft: FurnitureDraft): FurnitureConfig | null {
  const width = parseFurnitureDimension(draft.widthInput, draft.category, 'width')
  const depth = parseFurnitureDimension(draft.depthInput, draft.category, 'depth')
  const height = parseFurnitureDimension(draft.heightInput, draft.category, 'height')
  const color = normalizeFurnitureColor(draft.color)
  if (!width.ok || !depth.ok || !height.ok || !color) return null
  return createFurnitureConfig({
    category: draft.category,
    dimensions: { width: width.meters, depth: depth.meters, height: height.meters },
    color,
  })
}

export function createFurnitureConfig(input: {
  readonly category: FurnitureCategory
  readonly dimensions: FurnitureDimensions
  readonly color: FurnitureColor
  readonly id?: string
}): FurnitureConfig {
  return {
    id: input.id ?? createFurnitureId(),
    category: input.category,
    dimensions: { ...input.dimensions },
    color: normalizeFurnitureColor(input.color) ?? DEFAULT_FURNITURE_COLOR,
  }
}

/** Keep showing the last good model while the user is mid-edit. */
export function resolveFurniturePreview(draft: FurnitureDraft, lastValid: FurnitureConfig): FurnitureConfig {
  return parseFurnitureDraft(draft) ?? lastValid
}

export function withFurnitureColor(config: FurnitureConfig, color: FurnitureColor): FurnitureConfig {
  return { ...config, color: normalizeFurnitureColor(color) ?? config.color }
}

export function configFromDraft(draft: FurnitureDraft, id?: string): FurnitureConfig | null {
  const parsed = parseFurnitureDraft(draft)
  return parsed && id ? { ...parsed, id } : parsed
}
