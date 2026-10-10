import type { FloorPoint } from '../../../types/room'
import type { FurnitureCategory, FurnitureDimensionAxis, FurnitureDimensions, FurnitureInstance } from '../../../types/furniture'
import { FURNITURE_CATEGORY_LABELS } from '../catalog'
import {
  changeFurnitureCategory,
  changeFurnitureColor,
  changeFurnitureDimension,
  draftFromDefaults,
  parseFurnitureDraft,
  type FurnitureDraft,
} from '../furnitureConfig'
import { buildFurnitureLayout } from '../layout/buildFurnitureLayout'

/**
 * Furniture belongs to the confirmed outline and scale, not to the wall height.
 *
 * The editor clears this session when the floor plan, outline, or calibration
 * changes. Changing only the room height keeps every instance. Leaving the 3D
 * view during placement returns to create mode and drops the preview, so orbit
 * controls work again the next time the viewer opens. Returning to the 2D
 * editor and generating the same room keeps the instances.
 */
export const FURNITURE_DUPLICATE_OFFSET_X = 0.5

export const PLACEMENT_INSTRUCTION = 'Move over the floor and click to place. Press Esc to cancel.'

export type FurnitureMode =
  | { readonly kind: 'default' }
  | { readonly kind: 'create'; readonly draft: FurnitureDraft }
  | { readonly kind: 'placement'; readonly draft: FurnitureDraft; readonly preview: FloorPoint | null }
  | { readonly kind: 'edit'; readonly selectedId: string; readonly draft: FurnitureDraft }

export interface FurnitureSession {
  readonly instances: readonly FurnitureInstance[]
  readonly mode: FurnitureMode
}

export type FurnitureSessionAction =
  | { readonly type: 'furnitureCreateStarted' }
  | { readonly type: 'furnitureCreateCancelled' }
  | { readonly type: 'furnitureCategoryChanged'; readonly category: FurnitureCategory }
  | { readonly type: 'furnitureDimensionChanged'; readonly axis: FurnitureDimensionAxis; readonly input: string }
  | { readonly type: 'furnitureColorChanged'; readonly color: string }
  | { readonly type: 'furniturePlacementStarted' }
  | { readonly type: 'furniturePreviewMoved'; readonly position: FloorPoint | null }
  | {
      readonly type: 'furniturePlacementAttempted'
      readonly position: FloorPoint
      readonly inside: boolean
      readonly id: string
    }
  | { readonly type: 'furniturePlacementCancelled' }
  | { readonly type: 'furnitureSelected'; readonly id: string }
  | { readonly type: 'furnitureDeselected' }
  | { readonly type: 'furnitureDuplicated'; readonly id: string }
  | { readonly type: 'furnitureDeleted' }

const FURNITURE_ACTION_TYPES: ReadonlySet<FurnitureSessionAction['type']> = new Set([
  'furnitureCreateStarted',
  'furnitureCreateCancelled',
  'furnitureCategoryChanged',
  'furnitureDimensionChanged',
  'furnitureColorChanged',
  'furniturePlacementStarted',
  'furniturePreviewMoved',
  'furniturePlacementAttempted',
  'furniturePlacementCancelled',
  'furnitureSelected',
  'furnitureDeselected',
  'furnitureDuplicated',
  'furnitureDeleted',
])

export function isFurnitureSessionAction(action: { readonly type: string }): action is FurnitureSessionAction {
  return FURNITURE_ACTION_TYPES.has(action.type as FurnitureSessionAction['type'])
}

export function initialFurnitureSession(): FurnitureSession {
  return { instances: [], mode: { kind: 'default' } }
}

export function orbitControlsEnabled(session: FurnitureSession): boolean {
  return session.mode.kind !== 'placement'
}

export function selectedFurniture(session: FurnitureSession): FurnitureInstance | null {
  const { mode } = session
  if (mode.kind !== 'edit') return null
  return session.instances.find((instance) => instance.id === mode.selectedId) ?? null
}

/** "Sofa 1" follows insertion order among items of the same category. */
export function furnitureDisplayName(instances: readonly FurnitureInstance[], id: string): string {
  const item = instances.find((instance) => instance.id === id)
  if (!item) return ''
  const index = instances.filter((instance) => instance.category === item.category).findIndex((instance) => instance.id === id)
  return `${FURNITURE_CATEGORY_LABELS[item.category]} ${index + 1}`
}

export function draftFromInstance(instance: FurnitureInstance): FurnitureDraft {
  return {
    category: instance.category,
    widthInput: String(instance.dimensions.width),
    depthInput: String(instance.dimensions.depth),
    heightInput: String(instance.dimensions.height),
    color: instance.color,
  }
}

/** Drop the in-room preview and return to the create form. Instances stay. */
export function interruptFurniturePlacement(session: FurnitureSession): FurnitureSession {
  if (session.mode.kind !== 'placement') return session
  return { ...session, mode: { kind: 'create', draft: session.mode.draft } }
}

function withDraft(session: FurnitureSession, draft: FurnitureDraft): FurnitureSession {
  const { mode } = session
  if (mode.kind === 'create') return { ...session, mode: { kind: 'create', draft } }
  if (mode.kind === 'placement') return { ...session, mode: { ...mode, draft } }
  if (mode.kind === 'edit') {
    return {
      instances: applyDraftToSelected(session.instances, mode.selectedId, draft),
      mode: { ...mode, draft },
    }
  }
  return session
}

function applyDraftToSelected(
  instances: readonly FurnitureInstance[],
  selectedId: string,
  draft: FurnitureDraft,
): readonly FurnitureInstance[] {
  const parsed = parseFurnitureDraft(draft)
  if (!parsed) return instances
  const layout = buildFurnitureLayout({ ...parsed, id: selectedId })
  if (!layout) return instances
  return instances.map((instance) => {
    if (instance.id !== selectedId || instance.category !== draft.category) return instance
    if (sameAppearance(instance, parsed.dimensions, parsed.color)) return instance
    return { ...instance, dimensions: parsed.dimensions, color: parsed.color }
  })
}

function sameAppearance(
  instance: FurnitureInstance,
  dimensions: FurnitureDimensions,
  color: string,
): boolean {
  return (
    instance.color === color &&
    instance.dimensions.width === dimensions.width &&
    instance.dimensions.depth === dimensions.depth &&
    instance.dimensions.height === dimensions.height
  )
}

function samePreview(current: FloorPoint | null, next: FloorPoint | null): boolean {
  if (current === next) return true
  if (!current || !next) return false
  return current.x === next.x && current.z === next.z
}

export function reduceFurnitureSession(session: FurnitureSession, action: FurnitureSessionAction): FurnitureSession {
  switch (action.type) {
    case 'furnitureCreateStarted':
      if (session.mode.kind === 'placement') return session
      return { ...session, mode: { kind: 'create', draft: draftFromDefaults() } }
    case 'furnitureCreateCancelled':
      if (session.mode.kind !== 'create') return session
      return { ...session, mode: { kind: 'default' } }
    case 'furnitureCategoryChanged': {
      if (session.mode.kind !== 'create') return session
      return withDraft(session, changeFurnitureCategory(session.mode.draft, action.category))
    }
    case 'furnitureDimensionChanged': {
      if (session.mode.kind === 'default' || session.mode.kind === 'placement') return session
      return withDraft(session, changeFurnitureDimension(session.mode.draft, action.axis, action.input))
    }
    case 'furnitureColorChanged': {
      if (session.mode.kind === 'default' || session.mode.kind === 'placement') return session
      return withDraft(session, changeFurnitureColor(session.mode.draft, action.color))
    }
    case 'furniturePlacementStarted': {
      if (session.mode.kind !== 'create') return session
      const parsed = parseFurnitureDraft(session.mode.draft)
      if (!parsed || !buildFurnitureLayout(parsed)) return session
      return { ...session, mode: { kind: 'placement', draft: session.mode.draft, preview: null } }
    }
    case 'furniturePreviewMoved': {
      if (session.mode.kind !== 'placement' || samePreview(session.mode.preview, action.position)) return session
      return { ...session, mode: { ...session.mode, preview: action.position } }
    }
    case 'furniturePlacementAttempted': {
      if (session.mode.kind !== 'placement' || !action.inside) return session
      const parsed = parseFurnitureDraft(session.mode.draft)
      if (!parsed || !buildFurnitureLayout({ ...parsed, id: action.id })) return session
      if (session.instances.some((instance) => instance.id === action.id)) return session
      const instance: FurnitureInstance = {
        id: action.id,
        category: parsed.category,
        dimensions: parsed.dimensions,
        color: parsed.color,
        position: { x: action.position.x, z: action.position.z },
        rotationY: 0,
      }
      return {
        instances: [...session.instances, instance],
        mode: { kind: 'edit', selectedId: instance.id, draft: draftFromInstance(instance) },
      }
    }
    case 'furniturePlacementCancelled':
      return interruptFurniturePlacement(session)
    case 'furnitureSelected': {
      if (session.mode.kind === 'placement') return session
      if (session.mode.kind === 'edit' && session.mode.selectedId === action.id) return session
      const instance = session.instances.find((item) => item.id === action.id)
      if (!instance) return session
      return { ...session, mode: { kind: 'edit', selectedId: instance.id, draft: draftFromInstance(instance) } }
    }
    case 'furnitureDeselected':
      if (session.mode.kind !== 'edit') return session
      return { ...session, mode: { kind: 'default' } }
    case 'furnitureDuplicated': {
      const { mode } = session
      if (mode.kind !== 'edit') return session
      const source = session.instances.find((instance) => instance.id === mode.selectedId)
      if (!source || session.instances.some((instance) => instance.id === action.id)) return session
      const copy: FurnitureInstance = {
        id: action.id,
        category: source.category,
        dimensions: { ...source.dimensions },
        color: source.color,
        position: { x: source.position.x + FURNITURE_DUPLICATE_OFFSET_X, z: source.position.z },
        rotationY: source.rotationY,
      }
      return {
        instances: [...session.instances, copy],
        mode: { kind: 'edit', selectedId: copy.id, draft: draftFromInstance(copy) },
      }
    }
    case 'furnitureDeleted': {
      const { mode } = session
      if (mode.kind !== 'edit') return session
      return {
        instances: session.instances.filter((instance) => instance.id !== mode.selectedId),
        mode: { kind: 'default' },
      }
    }
  }
}
