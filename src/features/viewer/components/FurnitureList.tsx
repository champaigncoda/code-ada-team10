import { formatMeters } from '../../calibration/scale'
import {
  furnitureDisplayName,
  type FurnitureSession,
  type FurnitureSessionAction,
} from '../../furniture/session/furnitureSession'
import { furnitureSpatialStatus, type SpatialValidation } from '../../spatial/spatialWarnings'

interface FurnitureListProps {
  readonly session: FurnitureSession
  readonly validation: SpatialValidation
  readonly onAction: (action: FurnitureSessionAction) => void
}

function BoundsIcon() {
  return (
    <svg className="furniture-warning-icon furniture-warning-icon--bounds" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="Out of bounds">
      <path fill="currentColor" d="M8 1.4 15 14.2H1L8 1.4Zm0 4.1-.6 3.4h1.2L8 5.5ZM8.75 11.2a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  )
}

function OverlapIcon() {
  return (
    <svg className="furniture-warning-icon furniture-warning-icon--overlap" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="Overlaps other furniture">
      <rect x="1.2" y="1.2" width="8.2" height="8.2" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="6.6" y="6.6" width="8.2" height="8.2" rx="1.2" fill="currentColor" opacity="0.28" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function FurnitureList({ session, validation, onAction }: FurnitureListProps) {
  const placing = session.mode.kind === 'placement'
  const selectedId = session.mode.kind === 'edit' ? session.mode.selectedId : null

  return (
    <aside className="furniture-list" aria-label="Furniture list">
      <div className="furniture-list__scroll">
        {session.instances.length === 0 ? (
          <p className="furniture-list__empty">No furniture in this room yet.</p>
        ) : (
          <ul className="furniture-list__items">
            {session.instances.map((instance) => {
              const selected = instance.id === selectedId
              const status = furnitureSpatialStatus(validation, instance.id)
              return (
                <li key={instance.id}>
                  <button
                    type="button"
                    className={`furniture-list__item${selected ? ' furniture-list__item--selected' : ''}`}
                    aria-current={selected ? 'true' : undefined}
                    disabled={placing}
                    onClick={() => onAction({ type: 'furnitureSelected', id: instance.id })}
                  >
                    <span className="furniture-list__text">
                      <span className="furniture-list__name">{furnitureDisplayName(session.instances, instance.id)}</span>
                      <span className="furniture-list__size">
                        {formatMeters(instance.dimensions.width)} × {formatMeters(instance.dimensions.depth)} ×{' '}
                        {formatMeters(instance.dimensions.height)}
                      </span>
                    </span>
                    {(status.outOfBounds || status.overlapPartnerIds.length > 0) && (
                      <span className="furniture-list__warnings">
                        {status.outOfBounds && <BoundsIcon />}
                        {status.overlapPartnerIds.length > 0 && <OverlapIcon />}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="furniture-list__footer">
        <button
          type="button"
          className="button button--primary furniture-list__add"
          disabled={placing}
          onClick={() => onAction({ type: 'furnitureCreateStarted' })}
        >
          Add New Furniture
        </button>
      </div>
    </aside>
  )
}
