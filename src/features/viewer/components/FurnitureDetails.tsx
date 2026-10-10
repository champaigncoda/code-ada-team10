import { useMemo, useState } from 'react'
import { formatMeters } from '../../calibration/scale'
import { FURNITURE_CATEGORY_LABELS } from '../../furniture/catalog'
import { FurnitureConfigFields } from '../../furniture/components/FurnitureConfigPanel'
import { FurniturePreviewCanvas } from '../../furniture/components/FurniturePreviewCanvas'
import { createFurnitureId, parseFurnitureDraft } from '../../furniture/furnitureConfig'
import { buildFurnitureLayout } from '../../furniture/layout/buildFurnitureLayout'
import {
  PLACEMENT_INSTRUCTION,
  furnitureDisplayName,
  selectedFurniture,
  type FurnitureSession,
  type FurnitureSessionAction,
} from '../../furniture/session/furnitureSession'

interface RoomSummary {
  readonly wallCount: number
  readonly heightMeters: number
  readonly floorAreaSquareMeters: number
}

interface FurnitureDetailsProps {
  readonly session: FurnitureSession
  readonly room: RoomSummary | null
  readonly onAction: (action: FurnitureSessionAction) => void
}

export function FurnitureDetails({ session, room, onAction }: FurnitureDetailsProps) {
  const { mode } = session
  const draft = mode.kind === 'default' ? null : mode.draft
  const layout = useMemo(() => {
    if (!draft || mode.kind === 'placement') return null
    const parsed = parseFurnitureDraft(draft)
    return parsed ? buildFurnitureLayout(parsed) : null
  }, [draft, mode.kind])
  const [resetToken, setResetToken] = useState(0)

  return (
    <aside className="furniture-details" aria-label="Details">
      <div className="furniture-details__scroll">
        <h2 className="furniture-details__title">Details</h2>
        {mode.kind === 'default' && (
          <>
            {room && (
              <p className="furniture-details__room">
                {room.wallCount} walls · height {formatMeters(room.heightMeters)} · floor{' '}
                {room.floorAreaSquareMeters.toFixed(2)} m²
              </p>
            )}
            <p>Select a furniture item or add a new one.</p>
          </>
        )}
        {mode.kind === 'create' && draft && (
          <>
            <FurnitureConfigFields
              draft={draft}
              onCategoryChange={(category) => onAction({ type: 'furnitureCategoryChanged', category })}
              onDimensionChange={(axis, input) => onAction({ type: 'furnitureDimensionChanged', axis, input })}
              onColorChange={(color) => onAction({ type: 'furnitureColorChanged', color })}
            />
            <button
              type="button"
              className="button button--primary furniture-details__place"
              disabled={!layout}
              onClick={() => onAction({ type: 'furniturePlacementStarted' })}
            >
              Place in Room
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onAction({ type: 'furnitureCreateCancelled' })}
            >
              Cancel
            </button>
            <div className="furniture-details__preview">
              <div className="furniture-details__preview-frame">
                <FurniturePreviewCanvas layout={layout} color={draft.color} resetToken={resetToken} className="furniture-details__canvas" />
              </div>
              <button type="button" className="button button--secondary button--small" onClick={() => setResetToken((token) => token + 1)}>
                Reset preview camera
              </button>
            </div>
          </>
        )}
        {mode.kind === 'placement' && (
          <>
            <p className="furniture-details__instruction">{PLACEMENT_INSTRUCTION}</p>
            <p className="furniture-details__room">
              {FURNITURE_CATEGORY_LABELS[mode.draft.category]} · {mode.draft.widthInput} × {mode.draft.depthInput} ×{' '}
              {mode.draft.heightInput} m
            </p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onAction({ type: 'furniturePlacementCancelled' })}
            >
              Cancel placement
            </button>
          </>
        )}
        {mode.kind === 'edit' && draft && (
          <EditDetails session={session} onAction={onAction} />
        )}
      </div>
    </aside>
  )
}

function EditDetails({
  session,
  onAction,
}: {
  readonly session: FurnitureSession
  readonly onAction: (action: FurnitureSessionAction) => void
}) {
  if (session.mode.kind !== 'edit') return null
  const instance = selectedFurniture(session)
  if (!instance) return null
  const { draft } = session.mode
  return (
    <>
      <p className="furniture-details__name">{furnitureDisplayName(session.instances, instance.id)}</p>
      <p className="furniture-details__room">{FURNITURE_CATEGORY_LABELS[instance.category]}</p>
      <FurnitureConfigFields
        draft={draft}
        showCategory={false}
        onCategoryChange={() => undefined}
        onDimensionChange={(axis, input) => onAction({ type: 'furnitureDimensionChanged', axis, input })}
        onColorChange={(color) => onAction({ type: 'furnitureColorChanged', color })}
      />
      <div className="furniture-details__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => onAction({ type: 'furnitureDuplicated', id: createFurnitureId() })}
        >
          Duplicate
        </button>
        <button type="button" className="button furniture-details__delete" onClick={() => onAction({ type: 'furnitureDeleted' })}>
          Delete
        </button>
      </div>
    </>
  )
}
