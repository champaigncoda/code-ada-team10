import type { FurnitureInstance } from '../../../types/furniture'
import {
  formatOverlapMessage,
  furnitureSpatialStatus,
  type SpatialValidation,
} from '../../spatial/spatialWarnings'

interface SpatialWarningsPanelProps {
  readonly instances: readonly FurnitureInstance[]
  readonly furnitureId: string
  readonly validation: SpatialValidation
}

export function SpatialWarningsPanel({ instances, furnitureId, validation }: SpatialWarningsPanelProps) {
  const status = furnitureSpatialStatus(validation, furnitureId)
  const boundaryUnavailable = status.boundaryStatus === 'unavailable'
  const clear = status.geometryValid && !boundaryUnavailable && !status.outOfBounds && status.overlapPartnerIds.length === 0

  return (
    <section className="spatial-warnings" aria-label="Spatial Warnings">
      <h3 className="spatial-warnings__title">Spatial Warnings</h3>
      {status.outOfBounds && (
        <article className="spatial-warning spatial-warning--bounds">
          <h4>Out of Bounds</h4>
          <p>Part of this furniture extends beyond the room boundary.</p>
        </article>
      )}
      {status.overlapPartnerIds.length > 0 && (
        <article className="spatial-warning spatial-warning--overlap">
          <h4>Furniture Overlap</h4>
          <p>{formatOverlapMessage(instances, status.overlapPartnerIds)}</p>
        </article>
      )}
      {!status.geometryValid && (
        <p className="spatial-warnings__note">This furniture&apos;s footprint could not be validated.</p>
      )}
      {boundaryUnavailable && (
        <p className="spatial-warnings__note">
          Room boundary checks are unavailable because the room outline is not a valid polygon. The layout has not been
          fully validated.
        </p>
      )}
      {clear && <p className="spatial-warnings__clear">No spatial warnings.</p>}
      <p className="spatial-warnings__limit">
        Warnings use each item&apos;s rectangular floor footprint. They do not check 3D mesh contact, height, or whether
        the arrangement is safe.
      </p>
    </section>
  )
}
