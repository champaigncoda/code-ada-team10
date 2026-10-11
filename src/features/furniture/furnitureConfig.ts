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
  FURNITURE_CATEGORY_LABELS,
  FURNITURE_DEFAULTS,
  defaultColorFor,
} from './catalog'
import { normalizeFurnitureColor } from './color'
import { buildFurnitureLayout } from './layout/buildFurnitureLayout'

export const FURNITURE_CUSTOM_NAME_MAX = 40

export interface FurnitureDraft {
  readonly category: FurnitureCategory
  readonly widthInput: string
  readonly depthInput: string
  readonly heightInput: string
  readonly color: FurnitureColor
  /** Raw name field text. Empty means the automatic label. */
  readonly nameInput: string
}

export type CustomNameParse = { readonly ok: true; readonly name: string | undefined } | { readonly ok: false; readonly tooLong: true }

/** Empty or whitespace clears the name. More than 40 characters after trimming is rejected. */
export function parseCustomName(input: string): CustomNameParse {
  const trimmed = input.trim()
  if (trimmed.length === 0) return { ok: true, name: undefined }
  if (trimmed.length > FURNITURE_CUSTOM_NAME_MAX) return { ok: false, tooLong: true }
  return { ok: true, name: trimmed }
}

/** "<name> (copy)", shortened so the whole label stays within 40 characters. */
export function duplicateCustomName(name: string): string {
  const suffix = ' (copy)'
  if (name.length + suffix.length <= FURNITURE_CUSTOM_NAME_MAX) return `${name}${suffix}`
  const base = name.slice(0, FURNITURE_CUSTOM_NAME_MAX - suffix.length).trimEnd()
  return `${base}${suffix}`.trim()
}

export type FurnitureDimensionParseResult =
  | { readonly ok: true; readonly meters: number }
  | { readonly ok: false; readonly message: string }

const AXIS_LABEL: Record<FurnitureDimensionAxis, string> = {
  width: 'width',
  depth: 'depth',
  height: 'height',
}

export function createFurnitureId(): string {
  return `furn-${crypto.randomUUID()}`
}

export function draftFromDefaults(category: FurnitureCategory = DEFAULT_FURNITURE_CATEGORY, color?: FurnitureColor): FurnitureDraft {
  const defaults = FURNITURE_DEFAULTS[category]
  const resolved = color ?? defaultColorFor(category)
  return {
    category,
    widthInput: String(defaults.width),
    depthInput: String(defaults.depth),
    heightInput: String(defaults.height),
    color: normalizeFurnitureColor(resolved) ?? defaultColorFor(category),
    nameInput: '',
  }
}

export function changeFurnitureCategory(draft: FurnitureDraft, category: FurnitureCategory): FurnitureDraft {
  if (draft.category === category) return draft
  const color = draft.color === defaultColorFor(draft.category) ? defaultColorFor(category) : draft.color
  return { ...draftFromDefaults(category, color), nameInput: draft.nameInput }
}

export function changeFurnitureName(draft: FurnitureDraft, nameInput: string): FurnitureDraft {
  return { ...draft, nameInput }
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
  return parsePositiveMeters(input, {
    empty: `Enter the ${AXIS_LABEL[axis]} in meters.`,
    example: String(FURNITURE_DEFAULTS[category][axis]),
    nonPositive: `The ${AXIS_LABEL[axis]} must be greater than zero.`,
  })
}

/**
 * Shown when every field is a positive number but the parts cannot be assembled
 * into a model WebGL can actually draw.
 */
export function describeUnbuildableFurniture(draft: FurnitureDraft): string | null {
  const parsed = parseFurnitureDraft(draft)
  if (!parsed || buildFurnitureLayout(parsed)) return null
  const label = FURNITURE_CATEGORY_LABELS[draft.category].toLowerCase()
  const { width, depth, height } = parsed.dimensions
  if (Math.max(width, depth, height) > 1_000_000) {
    return `These dimensions are too large to build a stable ${label}. Reduce the width, depth, or height.`
  }
  return `These dimensions are too small to build a recognizable ${label}. Increase the width, depth, or height.`
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

/** Keep showing the last good model while the user is mid-edit or the size cannot be assembled. */
export function resolveFurniturePreview(draft: FurnitureDraft, lastValid: FurnitureConfig): FurnitureConfig {
  const parsed = parseFurnitureDraft(draft)
  if (!parsed || !buildFurnitureLayout({ ...parsed, id: lastValid.id })) return lastValid
  return { ...parsed, id: lastValid.id }
}

export function withFurnitureColor(config: FurnitureConfig, color: FurnitureColor): FurnitureConfig {
  return { ...config, color: normalizeFurnitureColor(color) ?? config.color }
}

export function configFromDraft(draft: FurnitureDraft, id?: string): FurnitureConfig | null {
  const parsed = parseFurnitureDraft(draft)
  return parsed && id ? { ...parsed, id } : parsed
}
