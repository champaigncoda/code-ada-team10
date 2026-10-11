import type { FurnitureInstance } from '../../types/furniture'
import { furnitureDisplayName } from '../furniture/session/furnitureSession'
import { doFurnitureFootprintsOverlap } from './footprintOverlap'
import { getFurnitureFootprint, type PointXZ } from './footprint'
import { assessRoomPolygon, classifyFurnitureContainment, type RoomBoundaryStatus } from './roomContainment'

export type SpatialWarning =
  | {
      readonly type: 'out-of-bounds'
      readonly furnitureId: string
    }
  | {
      readonly type: 'furniture-overlap'
      readonly furnitureIds: readonly [string, string]
    }

export interface SpatialValidation {
  readonly boundaryStatus: RoomBoundaryStatus
  /** Empty when nothing was flagged. Invalid geometry is listed separately and is not "all clear". */
  readonly warnings: readonly SpatialWarning[]
  readonly invalidFurnitureIds: readonly string[]
}

export interface FurnitureSpatialStatus {
  readonly outOfBounds: boolean
  readonly overlapPartnerIds: readonly string[]
  readonly geometryValid: boolean
  readonly boundaryStatus: RoomBoundaryStatus
}

/** Red wins over orange when one footprint has both problems. Records for both are kept. */
export type WarningOutlineKind = 'out-of-bounds' | 'furniture-overlap'

function orderedPair(left: string, right: string): readonly [string, string] {
  return left < right ? [left, right] : [right, left]
}

/**
 * One pass over the current instances. Footprints are built once and reused
 * for boundary and pairwise tests. Nothing is written back onto the instances.
 */
export function validateFurnitureLayout(
  instances: readonly FurnitureInstance[],
  roomPolygon: readonly PointXZ[],
): SpatialValidation {
  const boundaryStatus = assessRoomPolygon(roomPolygon)
  const prepared = instances.map((instance) => ({
    instance,
    footprint: getFurnitureFootprint(instance),
  }))
  const invalidFurnitureIds = prepared
    .filter((item) => item.footprint === null)
    .map((item) => item.instance.id)
  const warnings: SpatialWarning[] = []

  if (boundaryStatus === 'available') {
    for (const item of prepared) {
      if (!item.footprint) continue
      if (classifyFurnitureContainment(item.footprint, roomPolygon) === 'outside') {
        warnings.push({ type: 'out-of-bounds', furnitureId: item.instance.id })
      }
    }
  }

  for (let leftIndex = 0; leftIndex < prepared.length; leftIndex += 1) {
    const left = prepared[leftIndex]
    if (!left?.footprint) continue
    for (let rightIndex = leftIndex + 1; rightIndex < prepared.length; rightIndex += 1) {
      const right = prepared[rightIndex]
      if (!right?.footprint) continue
      if (!doFurnitureFootprintsOverlap(left.footprint, right.footprint)) continue
      warnings.push({
        type: 'furniture-overlap',
        furnitureIds: orderedPair(left.instance.id, right.instance.id),
      })
    }
  }

  return { boundaryStatus, warnings, invalidFurnitureIds }
}

export function furnitureSpatialStatus(validation: SpatialValidation, furnitureId: string): FurnitureSpatialStatus {
  const overlapPartnerIds: string[] = []
  let outOfBounds = false
  for (const warning of validation.warnings) {
    if (warning.type === 'out-of-bounds') {
      if (warning.furnitureId === furnitureId) outOfBounds = true
      continue
    }
    const [first, second] = warning.furnitureIds
    if (first === furnitureId) overlapPartnerIds.push(second)
    else if (second === furnitureId) overlapPartnerIds.push(first)
  }
  return {
    outOfBounds,
    overlapPartnerIds,
    geometryValid: !validation.invalidFurnitureIds.includes(furnitureId),
    boundaryStatus: validation.boundaryStatus,
  }
}

export function warningOutlineKind(validation: SpatialValidation, furnitureId: string): WarningOutlineKind | null {
  const status = furnitureSpatialStatus(validation, furnitureId)
  if (status.outOfBounds) return 'out-of-bounds'
  if (status.overlapPartnerIds.length > 0) return 'furniture-overlap'
  return null
}

function joinNames(names: readonly string[]): string {
  if (names.length === 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  const head = names.slice(0, -1).join(', ')
  return `${head}, and ${names[names.length - 1]}`
}

/**
 * Names follow the existing list labels ("Sofa 2"), in list order, with duplicates removed.
 */
export function formatOverlapMessage(
  instances: readonly FurnitureInstance[],
  partnerIds: readonly string[],
): string {
  const names: string[] = []
  const seen = new Set<string>()
  for (const instance of instances) {
    if (!partnerIds.includes(instance.id)) continue
    const name = furnitureDisplayName(instances, instance.id)
    if (!name || seen.has(name)) continue
    seen.add(name)
    names.push(name)
  }
  if (names.length === 0) return 'This furniture overlaps with another item.'
  return `This furniture overlaps with ${joinNames(names)}.`
}
