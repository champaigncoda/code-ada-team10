import { describe, expect, it } from 'vitest'
import type { FurnitureInstance } from '../../types/furniture'
import { outlineToFloorFootprint } from '../viewer/geometry/roomCoordinates'
import { RECTANGLE_PX, METERS_PER_PIXEL } from '../viewer/testFixtures'
import {
  initialFurnitureSession,
  orbitControlsEnabled,
  reduceFurnitureSession,
  type FurnitureSession,
  type FurnitureSessionAction,
} from '../furniture/session/furnitureSession'
import { selectionAfterPrimaryRelease } from '../furniture/interaction/transformMath'
import type { PointXZ } from './footprint'
import {
  formatOverlapMessage,
  furnitureSpatialStatus,
  validateFurnitureLayout,
  warningOutlineKind,
} from './spatialWarnings'

const ROOM = outlineToFloorFootprint(RECTANGLE_PX, METERS_PER_PIXEL)

function piece(id: string, x: number, z: number, width = 1, depth = 1, rotationY = 0, category: FurnitureInstance['category'] = 'sofa'): FurnitureInstance {
  return {
    id,
    category,
    dimensions: { width, depth, height: 0.8 },
    color: '#d4c4a8',
    position: { x, z },
    rotationY,
  }
}

function apply(session: FurnitureSession, ...actions: FurnitureSessionAction[]): FurnitureSession {
  return actions.reduce(reduceFurnitureSession, session)
}

function place(id: string, x: number, z: number, session = initialFurnitureSession()): FurnitureSession {
  return apply(
    session,
    { type: 'furnitureCreateStarted' },
    { type: 'furniturePlacementStarted' },
    { type: 'furniturePlacementAttempted', position: { x, z }, inside: true, id },
  )
}

describe('spatial warning aggregation', () => {
  it('stores unique unordered overlap pairs and no self pairs', () => {
    const instances = [piece('b', 0, 0), piece('a', 0.2, 0), piece('c', 5, 0)]
    const result = validateFurnitureLayout(instances, ROOM)
    const overlaps = result.warnings.filter((warning) => warning.type === 'furniture-overlap')
    expect(overlaps).toEqual([{ type: 'furniture-overlap', furnitureIds: ['a', 'b'] }])
    expect(furnitureSpatialStatus(result, 'a').overlapPartnerIds).toEqual(['b'])
    expect(furnitureSpatialStatus(result, 'b').overlapPartnerIds).toEqual(['a'])
    expect(furnitureSpatialStatus(result, 'c').overlapPartnerIds).toEqual([])
  })

  it('keeps every overlap that shares one item, plus an out-of-bounds warning', () => {
    const instances = [
      piece('sofa', 1.8, 0, 1, 1),
      piece('table', 1.6, 0.2, 1, 1, 0, 'table'),
      piece('bed', 1.7, -0.2, 1, 1, 0, 'bed'),
    ]
    const result = validateFurnitureLayout(instances, ROOM)
    expect(result.warnings).toEqual([
      { type: 'out-of-bounds', furnitureId: 'sofa' },
      { type: 'out-of-bounds', furnitureId: 'table' },
      { type: 'out-of-bounds', furnitureId: 'bed' },
      { type: 'furniture-overlap', furnitureIds: ['sofa', 'table'] },
      { type: 'furniture-overlap', furnitureIds: ['bed', 'sofa'] },
      { type: 'furniture-overlap', furnitureIds: ['bed', 'table'] },
    ])
    const sofa = furnitureSpatialStatus(result, 'sofa')
    expect(sofa.outOfBounds).toBe(true)
    expect(sofa.overlapPartnerIds).toEqual(['table', 'bed'])
    expect(warningOutlineKind(result, 'sofa')).toBe('out-of-bounds')
    expect(formatOverlapMessage(instances, sofa.overlapPartnerIds)).toBe('This furniture overlaps with Table 1 and Bed 1.')
  })

  it('drops warnings that named a deleted item and does not treat invalid geometry as clear', () => {
    const broken = piece('broken', 0, 0)
    const instances = [
      { ...broken, dimensions: { width: Number.NaN, depth: 1, height: 1 } },
      piece('other', 0, 0),
    ]
    const result = validateFurnitureLayout(instances, ROOM)
    expect(result.invalidFurnitureIds).toEqual(['broken'])
    expect(result.warnings).toEqual([])
    expect(furnitureSpatialStatus(result, 'broken').geometryValid).toBe(false)
    expect(furnitureSpatialStatus(result, 'other').geometryValid).toBe(true)
    expect(furnitureSpatialStatus(result, 'other').outOfBounds).toBe(false)

    const overlapping = [piece('keep', 0, 0), piece('gone', 0.2, 0)]
    const before = validateFurnitureLayout(overlapping, ROOM)
    expect(before.warnings).toHaveLength(1)
    const after = validateFurnitureLayout(overlapping.filter((instance) => instance.id !== 'gone'), ROOM)
    expect(after.warnings).toEqual([])
  })

  it('still reports overlap when the room polygon cannot be validated', () => {
    const bowtie: PointXZ[] = [
      { x: 0, z: 0 },
      { x: 1, z: 1 },
      { x: 0, z: 1 },
      { x: 1, z: 0 },
    ]
    const result = validateFurnitureLayout([piece('a', 0, 0, 0.4, 0.4), piece('b', 0.1, 0, 0.4, 0.4)], bowtie)
    expect(result.boundaryStatus).toBe('unavailable')
    expect(result.warnings).toEqual([{ type: 'furniture-overlap', furnitureIds: ['a', 'b'] }])
    expect(result.warnings.some((warning) => warning.type === 'out-of-bounds')).toBe(false)
  })
})

describe('warnings follow furniture edits', () => {
  it('updates during a drag and clears before the pointer would be released', () => {
    let session = place('sofa-1', 0, 0)
    session = apply(session, { type: 'furnitureDimensionChanged', axis: 'width', input: '1' }, {
      type: 'furnitureDimensionChanged',
      axis: 'depth',
      input: '1',
    })
    const id = 'sofa-1'
    expect(validateFurnitureLayout(session.instances, ROOM).warnings).toEqual([])
    expect(session.mode).toMatchObject({ kind: 'edit', selectedId: id })

    for (const x of [0.4, 0.9, 1.4, 1.8]) {
      session = apply(session, { type: 'furnitureMoved', id, x, z: 0 })
    }
    expect(furnitureSpatialStatus(validateFurnitureLayout(session.instances, ROOM), id).outOfBounds).toBe(true)
    expect(session.mode).toMatchObject({ kind: 'edit', selectedId: id })
    expect(orbitControlsEnabled(session)).toBe(true)

    for (const x of [1.4, 0.8, 0]) {
      session = apply(session, { type: 'furnitureMoved', id, x, z: 0 })
    }
    expect(validateFurnitureLayout(session.instances, ROOM).warnings).toEqual([])

    session = place('sofa-2', 1.2, 0, session)
    session = apply(
      session,
      { type: 'furnitureDimensionChanged', axis: 'width', input: '1' },
      { type: 'furnitureDimensionChanged', axis: 'depth', input: '1' },
      { type: 'furnitureSelected', id },
    )
    for (const x of [0.3, 0.7, 1]) {
      session = apply(session, { type: 'furnitureMoved', id, x, z: 0 })
    }
    const overlapping = validateFurnitureLayout(session.instances, ROOM)
    expect(furnitureSpatialStatus(overlapping, id).overlapPartnerIds).toEqual(['sofa-2'])
    expect(furnitureSpatialStatus(overlapping, 'sofa-2').overlapPartnerIds).toEqual([id])

    session = apply(session, { type: 'furnitureMoved', id, x: -1.2, z: 0 })
    expect(validateFurnitureLayout(session.instances, ROOM).warnings).toEqual([])

    expect(selectionAfterPrimaryRelease({
      downTarget: 'body',
      dragged: true,
      downId: id,
      selectedId: id,
    })).toBe(id)
    expect(session.instances.find((instance) => instance.id === id)?.position).toEqual({ x: -1.2, z: 0 })
  })

  it('updates for rotation, typed transforms, size edits, placement, duplicate, and delete', () => {
    let session = place('sofa-1', 1.5, 0)
    session = apply(session, { type: 'furnitureDimensionChanged', axis: 'width', input: '1' }, {
      type: 'furnitureDimensionChanged',
      axis: 'depth',
      input: '1',
    })
    expect(validateFurnitureLayout(session.instances, ROOM).warnings).toEqual([])

    session = apply(session, { type: 'furnitureRotated', id: 'sofa-1', rotationY: Math.PI / 4 })
    expect(furnitureSpatialStatus(validateFurnitureLayout(session.instances, ROOM), 'sofa-1').outOfBounds).toBe(true)

    session = apply(session, { type: 'furnitureRotationDraftChanged', input: '0' })
    expect(validateFurnitureLayout(session.instances, ROOM).warnings).toEqual([])

    session = apply(session, { type: 'furniturePositionDraftChanged', axis: 'x', input: '1.8' })
    expect(session.instances[0]?.position.x).toBe(1.8)
    expect(furnitureSpatialStatus(validateFurnitureLayout(session.instances, ROOM), 'sofa-1').outOfBounds).toBe(true)

    session = apply(session, { type: 'furniturePositionDraftChanged', axis: 'x', input: '0' })
    session = apply(session, { type: 'furnitureDimensionChanged', axis: 'width', input: '4.2' })
    expect(session.instances[0]?.dimensions.width).toBe(4.2)
    expect(furnitureSpatialStatus(validateFurnitureLayout(session.instances, ROOM), 'sofa-1').outOfBounds).toBe(true)

    session = apply(session, { type: 'furnitureDimensionChanged', axis: 'width', input: '1' })
    const placedOut = place('table-1', 1.9, 0, session)
    expect(furnitureSpatialStatus(validateFurnitureLayout(placedOut.instances, ROOM), 'table-1').outOfBounds).toBe(true)

    let duplicated = apply(session, { type: 'furnitureDimensionChanged', axis: 'width', input: '1.2' })
    duplicated = apply(duplicated, { type: 'furnitureDuplicated', id: 'sofa-copy' })
    const copyWarnings = validateFurnitureLayout(duplicated.instances, ROOM)
    expect(copyWarnings.warnings.some((warning) => warning.type === 'furniture-overlap')).toBe(true)

    const deleted = apply(duplicated, { type: 'furnitureDeleted' })
    expect(deleted.instances).toHaveLength(1)
    expect(validateFurnitureLayout(deleted.instances, ROOM).warnings).toEqual([])
  })
})
