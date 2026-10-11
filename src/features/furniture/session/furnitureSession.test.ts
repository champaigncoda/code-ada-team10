import { describe, expect, it } from 'vitest'
import { FURNITURE_DEFAULTS } from '../catalog'
import {
  FURNITURE_DUPLICATE_OFFSET_X,
  draftFromInstance,
  furnitureDisplayName,
  initialFurnitureSession,
  orbitControlsEnabled,
  reduceFurnitureSession,
  type FurnitureSession,
  type FurnitureSessionAction,
} from './furnitureSession'

function apply(session: FurnitureSession, ...actions: FurnitureSessionAction[]): FurnitureSession {
  return actions.reduce(reduceFurnitureSession, session)
}

function placed(id = 'sofa-1', inside = true): FurnitureSession {
  return apply(
    initialFurnitureSession(),
    { type: 'furnitureCreateStarted' },
    { type: 'furniturePlacementStarted' },
    { type: 'furniturePlacementAttempted', position: { x: 0.25, z: -0.4 }, inside, id },
  )
}

describe('furniture instances', () => {
  it('creates exactly one instance on a valid placement and none when cancelled', () => {
    const session = placed()
    expect(session.instances).toHaveLength(1)
    expect(session.instances[0]?.id).toBe('sofa-1')
    expect(session.instances[0]?.rotationY).toBe(0)
    expect(session.instances[0]?.position).toEqual({ x: 0.25, z: -0.4 })
    expect(session.mode).toMatchObject({ kind: 'edit', selectedId: 'sofa-1' })

    const cancelled = apply(
      initialFurnitureSession(),
      { type: 'furnitureCreateStarted' },
      { type: 'furniturePlacementStarted' },
      { type: 'furniturePreviewMoved', position: { x: 1, z: 1 } },
      { type: 'furniturePlacementCancelled' },
    )
    expect(cancelled.instances).toHaveLength(0)
    expect(cancelled.mode.kind).toBe('create')
  })

  it('keeps two sofas independent', () => {
    const first = placed('sofa-1')
    const second = apply(
      first,
      { type: 'furnitureCreateStarted' },
      { type: 'furnitureCategoryChanged', category: 'sofa' },
      { type: 'furnitureDimensionChanged', axis: 'width', input: '1.8' },
      { type: 'furnitureColorChanged', color: '#2c3d5a' },
      { type: 'furniturePlacementStarted' },
      { type: 'furniturePlacementAttempted', position: { x: 1, z: 0.2 }, inside: true, id: 'sofa-2' },
    )
    expect(second.instances.map((item) => item.id)).toEqual(['sofa-1', 'sofa-2'])
    expect(second.instances[0]?.dimensions.width).toBe(FURNITURE_DEFAULTS.sofa.width)
    expect(second.instances[0]?.color).toBe('#d4c4a8')
    expect(second.instances[1]?.dimensions.width).toBe(1.8)
    expect(second.instances[1]?.color).toBe('#2c3d5a')
    expect(furnitureDisplayName(second.instances, 'sofa-1')).toBe('Sofa 1')
    expect(furnitureDisplayName(second.instances, 'sofa-2')).toBe('Sofa 2')
  })

  it('does not place when the click is outside the room', () => {
    const before = apply(initialFurnitureSession(), { type: 'furnitureCreateStarted' }, { type: 'furniturePlacementStarted' })
    const after = apply(before, {
      type: 'furniturePlacementAttempted',
      position: { x: 9, z: 9 },
      inside: false,
      id: 'ignored',
    })
    expect(after).toBe(before)
    expect(after.mode.kind).toBe('placement')
    expect(after.instances).toHaveLength(0)
  })
})

describe('furniture interaction mode', () => {
  it('walks the create, place, edit, and cancel transitions', () => {
    const created = apply(initialFurnitureSession(), { type: 'furnitureCreateStarted' })
    expect(created.mode.kind).toBe('create')
    expect(orbitControlsEnabled(created)).toBe(true)

    const placing = apply(created, { type: 'furniturePlacementStarted' })
    expect(placing.mode.kind).toBe('placement')
    expect(orbitControlsEnabled(placing)).toBe(false)

    const editing = apply(placing, {
      type: 'furniturePlacementAttempted',
      position: { x: 0, z: 0 },
      inside: true,
      id: 'table-1',
    })
    expect(editing.mode).toMatchObject({ kind: 'edit', selectedId: 'table-1' })
    expect(orbitControlsEnabled(editing)).toBe(true)

    const backToCreate = apply(placing, { type: 'furniturePlacementCancelled' })
    expect(backToCreate.mode.kind).toBe('create')
    expect(backToCreate.instances).toHaveLength(0)

    const deselected = apply(editing, { type: 'furnitureDeselected' })
    expect(deselected.mode.kind).toBe('default')

    const reselected = apply(deselected, { type: 'furnitureSelected', id: 'table-1' })
    expect(reselected.mode).toMatchObject({ kind: 'edit', selectedId: 'table-1' })

    const creatingAgain = apply(reselected, { type: 'furnitureCreateStarted' })
    expect(creatingAgain.mode.kind).toBe('create')
    expect(selectedId(creatingAgain)).toBeNull()
  })

  it('selects from create mode and ignores selection during placement', () => {
    const editing = placed('sofa-1')
    const creating = apply(editing, { type: 'furnitureCreateStarted' })
    const back = apply(creating, { type: 'furnitureSelected', id: 'sofa-1' })
    expect(back.mode).toMatchObject({ kind: 'edit', selectedId: 'sofa-1' })

    const placing = apply(creating, { type: 'furniturePlacementStarted' })
    expect(apply(placing, { type: 'furnitureSelected', id: 'sofa-1' })).toBe(placing)
    expect(apply(placing, { type: 'furnitureCreateStarted' })).toBe(placing)
  })

  it('switches the edit draft when another instance is selected', () => {
    const session = apply(placed('sofa-1'), { type: 'furnitureDimensionChanged', axis: 'width', input: '2.' })
    const withTable = apply(
      session,
      { type: 'furnitureCreateStarted' },
      { type: 'furnitureCategoryChanged', category: 'table' },
      { type: 'furniturePlacementStarted' },
      { type: 'furniturePlacementAttempted', position: { x: 1, z: 1 }, inside: true, id: 'table-1' },
    )
    const backToSofa = apply(withTable, { type: 'furnitureSelected', id: 'sofa-1' })
    expect(backToSofa.mode.kind).toBe('edit')
    if (backToSofa.mode.kind !== 'edit') return
    expect(backToSofa.mode.draft.widthInput).toBe(String(backToSofa.instances[0]?.dimensions.width))
    expect(backToSofa.mode.selectedId).toBe('sofa-1')
  })
})

describe('furniture editing and management', () => {
  it('updates only the selected item and keeps the last valid size while typing', () => {
    const session = placed('sofa-1')
    const cleared = apply(session, { type: 'furnitureDimensionChanged', axis: 'width', input: '' })
    expect(cleared.instances[0]?.dimensions).toEqual(FURNITURE_DEFAULTS.sofa)
    expect(cleared.instances[0]?.position).toEqual({ x: 0.25, z: -0.4 })
    const widened = apply(cleared, { type: 'furnitureDimensionChanged', axis: 'width', input: '2.4' })
    expect(widened.instances[0]?.dimensions.width).toBe(2.4)
    expect(widened.instances[0]?.dimensions.depth).toBe(FURNITURE_DEFAULTS.sofa.depth)
    expect(widened.instances[0]?.position).toEqual(session.instances[0]?.position)
    expect(widened.instances[0]?.rotationY).toBe(0)

    const recolored = apply(widened, { type: 'furnitureColorChanged', color: '#8b9099' })
    expect(recolored.instances[0]?.color).toBe('#8b9099')
    expect(recolored.instances[0]?.dimensions).toEqual(widened.instances[0]?.dimensions)
  })

  it('duplicates with a new id and a half-meter offset, then deletes only the selection', () => {
    const session = placed('sofa-1')
    const duplicated = apply(session, { type: 'furnitureDuplicated', id: 'sofa-2' })
    expect(duplicated.instances).toHaveLength(2)
    expect(duplicated.instances[1]).toMatchObject({
      id: 'sofa-2',
      category: 'sofa',
      color: duplicated.instances[0]?.color,
      rotationY: 0,
      position: { x: 0.25 + FURNITURE_DUPLICATE_OFFSET_X, z: -0.4 },
    })
    expect(duplicated.instances[1]?.dimensions).not.toBe(duplicated.instances[0]?.dimensions)
    expect(duplicated.mode).toMatchObject({ kind: 'edit', selectedId: 'sofa-2' })
    expect(draftFromInstance(duplicated.instances[0]!).category).toBe('sofa')

    const deleted = apply(duplicated, { type: 'furnitureDeleted' })
    expect(deleted.instances.map((item) => item.id)).toEqual(['sofa-1'])
    expect(deleted.mode.kind).toBe('default')
    expect(apply(apply(deleted, { type: 'furnitureSelected', id: 'sofa-1' }), { type: 'furnitureDeleted' }).instances).toEqual([])
  })
})

describe('custom furniture names', () => {
  it('falls back to the automatic name when no custom name is set', () => {
    const session = placed('sofa-1')
    expect(session.instances[0]?.customName).toBeUndefined()
    expect(furnitureDisplayName(session.instances, 'sofa-1')).toBe('Sofa 1')
  })

  it('trims a name, clears a blank one, and keeps the previous name past 40 characters', () => {
    const named = apply(placed('sofa-1'), { type: 'furnitureNameChanged', input: '  Reading nook  ' })
    expect(named.instances[0]?.customName).toBe('Reading nook')
    expect(furnitureDisplayName(named.instances, 'sofa-1')).toBe('Reading nook')

    const cleared = apply(named, { type: 'furnitureNameChanged', input: '   ' })
    expect(cleared.instances[0]?.customName).toBeUndefined()
    expect(furnitureDisplayName(cleared.instances, 'sofa-1')).toBe('Sofa 1')

    const tooLong = 'a'.repeat(41)
    const rejected = apply(named, { type: 'furnitureNameChanged', input: tooLong })
    expect(rejected.instances[0]?.customName).toBe('Reading nook')
    expect(rejected.mode).toMatchObject({ kind: 'edit', draft: { nameInput: tooLong } })

    const max = apply(named, { type: 'furnitureNameChanged', input: 'b'.repeat(40) })
    expect(max.instances[0]?.customName).toBe('b'.repeat(40))
  })

  it('renames in edit mode without changing placement, size, rotation, or color', () => {
    const session = placed('sofa-1')
    const before = session.instances[0]
    const renamed = apply(session, { type: 'furnitureNameChanged', input: 'Window seat' })
    const after = renamed.instances[0]
    expect(after?.customName).toBe('Window seat')
    expect(after?.position).toEqual(before?.position)
    expect(after?.dimensions).toEqual(before?.dimensions)
    expect(after?.rotationY).toBe(before?.rotationY)
    expect(after?.color).toBe(before?.color)
    expect(after?.category).toBe(before?.category)

    const recolored = apply(renamed, { type: 'furnitureColorChanged', color: '#8b9099' })
    expect(recolored.instances[0]?.customName).toBe('Window seat')
    expect(recolored.instances[0]?.color).toBe('#8b9099')
    expect(recolored.instances[0]?.position).toEqual(before?.position)
  })

  it('copies a custom name with a (copy) suffix and leaves an unnamed copy automatic', () => {
    const named = apply(placed('sofa-1'), { type: 'furnitureNameChanged', input: 'Lamp' })
    const copied = apply(named, { type: 'furnitureDuplicated', id: 'sofa-2' })
    expect(copied.instances[1]?.customName).toBe('Lamp (copy)')
    expect(furnitureDisplayName(copied.instances, 'sofa-1')).toBe('Lamp')
    expect(furnitureDisplayName(copied.instances, 'sofa-2')).toBe('Lamp (copy)')
    expect(copied.instances[0]?.position).toEqual(named.instances[0]?.position)

    const longNamed = apply(placed('sofa-1'), { type: 'furnitureNameChanged', input: 'd'.repeat(40) })
    const longCopy = apply(longNamed, { type: 'furnitureDuplicated', id: 'sofa-2' })
    expect(longCopy.instances[1]?.customName).toHaveLength(40)
    expect(longCopy.instances[1]?.customName?.endsWith(' (copy)')).toBe(true)

    const plain = apply(placed('sofa-1'), { type: 'furnitureDuplicated', id: 'sofa-2' })
    expect(plain.instances[1]?.customName).toBeUndefined()
    expect(furnitureDisplayName(plain.instances, 'sofa-1')).toBe('Sofa 1')
    expect(furnitureDisplayName(plain.instances, 'sofa-2')).toBe('Sofa 2')
  })

  it('keeps a typed name when the category changes while creating', () => {
    const session = apply(
      initialFurnitureSession(),
      { type: 'furnitureCreateStarted' },
      { type: 'furnitureNameChanged', input: 'Guest bed' },
      { type: 'furnitureCategoryChanged', category: 'bed' },
    )
    expect(session.mode).toMatchObject({ kind: 'create', draft: { category: 'bed', nameInput: 'Guest bed' } })
  })
})

describe('transform editing', () => {
  it('moves and rotates only the targeted instance and keeps the other still', () => {
    const session = apply(placed('sofa-1'), {
      type: 'furnitureCreateStarted',
    }, {
      type: 'furniturePlacementStarted',
    }, {
      type: 'furniturePlacementAttempted',
      position: { x: 2, z: 0 },
      inside: true,
      id: 'sofa-2',
    })
    const moved = apply(session, { type: 'furnitureMoved', id: 'sofa-2', x: -0.5, z: 1.25 })
    expect(moved.instances[0]?.position).toEqual({ x: 0.25, z: -0.4 })
    expect(moved.instances[1]?.position).toEqual({ x: -0.5, z: 1.25 })
    expect(moved.instances[1]?.rotationY).toBe(0)
    if (moved.mode.kind !== 'edit') throw new Error('expected edit mode')
    expect(moved.mode.transform.xInput).toBe('-0.5')
    expect(moved.mode.transform.zInput).toBe('1.25')

    const turned = apply(moved, { type: 'furnitureRotationShortcut', degrees: 270 })
    expect(turned.instances[1]?.rotationY).toBeCloseTo((270 * Math.PI) / 180)
    expect(turned.instances[0]?.rotationY).toBe(0)
    expect(turned.instances[1]?.position).toEqual({ x: -0.5, z: 1.25 })
    if (turned.mode.kind !== 'edit') throw new Error('expected edit mode')
    expect(turned.mode.transform.rotationInput).toBe('270')
  })

  it('keeps the last position while a coordinate is incomplete, then applies a valid one', () => {
    const session = placed('sofa-1')
    const incomplete = apply(session, { type: 'furniturePositionDraftChanged', axis: 'x', input: '-' })
    expect(incomplete.instances[0]?.position.x).toBe(0.25)
    const shifted = apply(incomplete, { type: 'furniturePositionDraftChanged', axis: 'x', input: '-1.5' })
    expect(shifted.instances[0]?.position).toEqual({ x: -1.5, z: -0.4 })
    const bad = apply(shifted, { type: 'furnitureRotationDraftChanged', input: 'nope' })
    expect(bad.instances[0]?.rotationY).toBe(0)
    if (bad.mode.kind !== 'edit') throw new Error('expected edit mode')
    expect(bad.mode.transform.rotationInput).toBe('nope')
  })
})

function selectedId(session: FurnitureSession): string | null {
  return session.mode.kind === 'edit' ? session.mode.selectedId : null
}
