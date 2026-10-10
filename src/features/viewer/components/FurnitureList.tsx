import { formatMeters } from '../../calibration/scale'
import {
  furnitureDisplayName,
  type FurnitureSession,
  type FurnitureSessionAction,
} from '../../furniture/session/furnitureSession'

interface FurnitureListProps {
  readonly session: FurnitureSession
  readonly onAction: (action: FurnitureSessionAction) => void
}

export function FurnitureList({ session, onAction }: FurnitureListProps) {
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
              return (
                <li key={instance.id}>
                  <button
                    type="button"
                    className={`furniture-list__item${selected ? ' furniture-list__item--selected' : ''}`}
                    aria-current={selected ? 'true' : undefined}
                    disabled={placing}
                    onClick={() => onAction({ type: 'furnitureSelected', id: instance.id })}
                  >
                    <span className="furniture-list__name">{furnitureDisplayName(session.instances, instance.id)}</span>
                    <span className="furniture-list__size">
                      {formatMeters(instance.dimensions.width)} × {formatMeters(instance.dimensions.depth)} ×{' '}
                      {formatMeters(instance.dimensions.height)}
                    </span>
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
