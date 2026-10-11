import type { FloorPoint } from '../../../types/room'
import type { FurnitureCategory, FurnitureDimensionAxis, FurnitureDimensions, FurnitureInstance } from '../../../types/furniture'
import { FURNITURE_CATEGORY_LABELS } from '../catalog'
import {
  changeFurnitureCategory,
  changeFurnitureColor,
  changeFurnitureDimension,
  changeFurnitureName,
  draftFromDefaults,
  duplicateCustomName,
  parseCustomName,
  parseFurnitureDraft,
  type FurnitureDraft,
} from '../furnitureConfig'
import { buildFurnitureLayout } from '../layout/buildFurnitureLayout'
import {
  degreesToRadians,
  formatCoordinate,
  formatDegrees,
  parseSignedDecimal,
} from '../interaction/transformMath'

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

export interface TransformDraft {
  readonly xInput: string
  readonly zInput: string
  readonly rotationInput: string
}

export type FurnitureMode =
  | { readonly kind: 'default' }
  | { readonly kind: 'create'; readonly draft: FurnitureDraft }
  | { readonly kind: 'placement'; readonly draft: FurnitureDraft; readonly preview: FloorPoint | null }
  | {
      readonly kind: 'edit'
      readonly selectedId: string
      readonly draft: FurnitureDraft
      readonly transform: TransformDraft
    }

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
  | { readonly type: 'furnitureNameChanged'; readonly input: string }
  | { readonly type: 'furnitureNameReset' }
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
  | { readonly type: 'furnitureMoved'; readonly id: string; readonly x: number; readonly z: number }
  | { readonly type: 'furnitureRotated'; readonly id: string; readonly rotationY: number }
  | { readonly type: 'furniturePositionDraftChanged'; readonly axis: 'x' | 'z'; readonly input: string }
  | { readonly type: 'furnitureRotationDraftChanged'; readonly input: string }
  | { readonly type: 'furnitureRotationShortcut'; readonly degrees: number }

const FURNITURE_ACTION_TYPES: ReadonlySet<FurnitureSessionAction['type']> = new Set([
  'furnitureCreateStarted',
  'furnitureCreateCancelled',
  'furnitureCategoryChanged',
  'furnitureDimensionChanged',
  'furnitureColorChanged',
  'furnitureNameChanged',
  'furnitureNameReset',
  'furniturePlacementStarted',
  'furniturePreviewMoved',
  'furniturePlacementAttempted',
  'furniturePlacementCancelled',
  'furnitureSelected',
  'furnitureDeselected',
  'furnitureDuplicated',
  'furnitureDeleted',
  'furnitureMoved',
  'furnitureRotated',
  'furniturePositionDraftChanged',
  'furnitureRotationDraftChanged',
  'furnitureRotationShortcut',
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

/** "Sofa 1" follows insertion order among items of the same category, including named items. */
export function furnitureAutomaticName(instances: readonly FurnitureInstance[], id: string): string {
  const item = instances.find((instance) => instance.id === id)
  if (!item) return ''
  const index = instances.filter((instance) => instance.category === item.category).findIndex((instance) => instance.id === id)
  return `${FURNITURE_CATEGORY_LABELS[item.category]} ${index + 1}`
}

/** The label this category would get if placed next, based on items already in the room. */
export function nextAutomaticName(instances: readonly FurnitureInstance[], category: FurnitureInstance['category']): string {
  const count = instances.filter((instance) => instance.category === category).length
  return `${FURNITURE_CATEGORY_LABELS[category]} ${count + 1}`
}

/** Custom name when one is saved; otherwise the automatic "Sofa 1" label. */
export function furnitureDisplayName(instances: readonly FurnitureInstance[], id: string): string {
  const item = instances.find((instance) => instance.id === id)
  if (!item) return ''
  return item.customName ?? furnitureAutomaticName(instances, id)
}

export function transformFromInstance(instance: FurnitureInstance): TransformDraft {
  return {
    xInput: formatCoordinate(instance.position.x),
    zInput: formatCoordinate(instance.position.z),
    rotationInput: formatDegrees(instance.rotationY),
  }
}

/** The arc is only shown while one placed item is being edited. */
export function rotationHandleVisible(mode: FurnitureMode): boolean {
  return mode.kind === 'edit'
}

function editMode(instance: FurnitureInstance): FurnitureMode {
  return {
    kind: 'edit',
    selectedId: instance.id,
    draft: draftFromInstance(instance),
    transform: transformFromInstance(instance),
  }
}

export function draftFromInstance(instance: FurnitureInstance): FurnitureDraft {
  return {
    category: instance.category,
    widthInput: String(instance.dimensions.width),
    depthInput: String(instance.dimensions.depth),
    heightInput: String(instance.dimensions.height),
    color: instance.color,
    nameInput: instance.customName ?? '',
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
    case 'furnitureNameChanged':
      return changeName(session, action.input)
    case 'furnitureNameReset':
      return changeName(session, '')
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
      const named = parseCustomName(session.mode.draft.nameInput)
      const instance: FurnitureInstance = {
        id: action.id,
        category: parsed.category,
        dimensions: parsed.dimensions,
        color: parsed.color,
        position: { x: action.position.x, z: action.position.z },
        rotationY: 0,
        ...(named.ok && named.name ? { customName: named.name } : {}),
      }
      return {
        instances: [...session.instances, instance],
        mode: editMode(instance),
      }
    }
    case 'furniturePlacementCancelled':
      return interruptFurniturePlacement(session)
    case 'furnitureSelected': {
      if (session.mode.kind === 'placement') return session
      if (session.mode.kind === 'edit' && session.mode.selectedId === action.id) return session
      const instance = session.instances.find((item) => item.id === action.id)
      if (!instance) return session
      return { ...session, mode: editMode(instance) }
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
        ...(source.customName ? { customName: duplicateCustomName(source.customName) } : {}),
      }
      return {
        instances: [...session.instances, copy],
        mode: editMode(copy),
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
    case 'furnitureMoved':
      return commitTransform(session, action.id, { x: action.x, z: action.z })
    case 'furnitureRotated':
      return commitTransform(session, action.id, { rotationY: action.rotationY })
    case 'furniturePositionDraftChanged':
      return changePositionDraft(session, action.axis, action.input)
    case 'furnitureRotationDraftChanged':
      return changeRotationDraft(session, action.input)
    case 'furnitureRotationShortcut':
      return commitTransform(session, selectedIdOf(session), { rotationY: degreesToRadians(action.degrees) })
  }
}

function changeName(session: FurnitureSession, input: string): FurnitureSession {
  const { mode } = session
  if (mode.kind !== 'create' && mode.kind !== 'placement' && mode.kind !== 'edit') return session
  const draft = changeFurnitureName(mode.draft, input)
  if (mode.kind !== 'edit') return { ...session, mode: { ...mode, draft } }
  const parsed = parseCustomName(input)
  if (!parsed.ok) return { ...session, mode: { ...mode, draft } }
  return {
    instances: session.instances.map((instance) =>
      instance.id === mode.selectedId ? withCustomName(instance, parsed.name) : instance,
    ),
    mode: { ...mode, draft },
  }
}

function withCustomName(instance: FurnitureInstance, name: string | undefined): FurnitureInstance {
  if (name === undefined) {
    if (instance.customName === undefined) return instance
    return {
      id: instance.id,
      category: instance.category,
      dimensions: instance.dimensions,
      color: instance.color,
      position: instance.position,
      rotationY: instance.rotationY,
    }
  }
  if (instance.customName === name) return instance
  return { ...instance, customName: name }
}

function selectedIdOf(session: FurnitureSession): string | null {
  return session.mode.kind === 'edit' ? session.mode.selectedId : null
}

function commitTransform(
  session: FurnitureSession,
  id: string | null,
  patch: { readonly x?: number; readonly z?: number; readonly rotationY?: number },
): FurnitureSession {
  if (!id || !session.instances.some((instance) => instance.id === id)) return session
  if (patch.x !== undefined && !Number.isFinite(patch.x)) return session
  if (patch.z !== undefined && !Number.isFinite(patch.z)) return session
  if (patch.rotationY !== undefined && !Number.isFinite(patch.rotationY)) return session
  const instances = session.instances.map((instance) => {
    if (instance.id !== id) return instance
    const next = {
      ...instance,
      position: { x: patch.x ?? instance.position.x, z: patch.z ?? instance.position.z },
      rotationY: patch.rotationY ?? instance.rotationY,
    }
    if (
      next.position.x === instance.position.x &&
      next.position.z === instance.position.z &&
      next.rotationY === instance.rotationY
    ) {
      return instance
    }
    return next
  })
  const { mode } = session
  if (mode.kind !== 'edit' || mode.selectedId !== id) return { ...session, instances }
  const updated = instances.find((instance) => instance.id === id)
  if (!updated) return { ...session, instances }
  return { instances, mode: { ...mode, transform: transformFromInstance(updated) } }
}

function changePositionDraft(session: FurnitureSession, axis: 'x' | 'z', input: string): FurnitureSession {
  const { mode } = session
  if (mode.kind !== 'edit') return session
  const transform = axis === 'x' ? { ...mode.transform, xInput: input } : { ...mode.transform, zInput: input }
  const parsed = parseSignedDecimal(input)
  if (!parsed.ok) return { ...session, mode: { ...mode, transform } }
  const patch = axis === 'x' ? { x: parsed.value } : { z: parsed.value }
  const next = commitTransform({ ...session, mode: { ...mode, transform } }, mode.selectedId, patch)
  // Keep the typed text. commitTransform rewrites both fields from the instance.
  return next.mode.kind === 'edit' ? { ...next, mode: { ...next.mode, transform } } : next
}

function changeRotationDraft(session: FurnitureSession, input: string): FurnitureSession {
  const { mode } = session
  if (mode.kind !== 'edit') return session
  const transform = { ...mode.transform, rotationInput: input }
  const parsed = parseSignedDecimal(input)
  if (!parsed.ok) return { ...session, mode: { ...mode, transform } }
  const next = commitTransform(
    { ...session, mode: { ...mode, transform } },
    mode.selectedId,
    { rotationY: degreesToRadians(parsed.value) },
  )
  return next.mode.kind === 'edit' ? { ...next, mode: { ...next.mode, transform } } : next
}
