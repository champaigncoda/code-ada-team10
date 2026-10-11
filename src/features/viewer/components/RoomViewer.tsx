import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import type { RoomAppearance, RoomModelSource, RoomSurface } from '../../../types/room'
import { formatMeters } from '../../calibration/scale'
import { RoomColorsPanel } from '../../room/components/RoomColorsPanel'
import { PLACEMENT_INSTRUCTION, orbitControlsEnabled, type FurnitureSession, type FurnitureSessionAction } from '../../furniture/session/furnitureSession'
import { VIEWER_FOV_DEGREES } from '../camera/cameraView'
import { buildRoomGeometry } from '../geometry/roomGeometry'
import { VIEWER_BACKGROUND } from '../materials'
import { FurnitureDetails } from './FurnitureDetails'
import { FurnitureList } from './FurnitureList'
import { RoomScene } from './RoomScene'
import { ViewerToolbar } from './ViewerToolbar'
import './RoomViewer.css'

interface RoomViewerProps {
  readonly source: RoomModelSource
  readonly session: FurnitureSession
  readonly appearance: RoomAppearance
  readonly onAction: (action: FurnitureSessionAction) => void
  readonly onRoomColorChange: (surface: RoomSurface, color: string) => void
  readonly onReturnToEditor: () => void
}

export function RoomViewer({
  source,
  session,
  appearance,
  onAction,
  onRoomColorChange,
  onReturnToEditor,
}: RoomViewerProps) {
  const [showWalls, setShowWalls] = useState(true)
  const [resetToken, setResetToken] = useState(0)
  const [topToken, setTopToken] = useState(0)
  const geometry = useMemo(() => buildRoomGeometry(source), [source])
  const placing = session.mode.kind === 'placement'

  useEffect(() => {
    if (!placing) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onAction({ type: 'furniturePlacementCancelled' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onAction, placing])

  if (!geometry) {
    return (
      <section className="room-viewer" aria-label="3D room viewer">
        <ViewerToolbar
          showWalls={showWalls}
          onToggleWalls={() => setShowWalls((visible) => !visible)}
          onResetCamera={() => setResetToken((token) => token + 1)}
          onTopView={() => setTopToken((token) => token + 1)}
          onReturnToEditor={onReturnToEditor}
        />
        <p className="room-viewer__error" role="alert">
          The 3D room could not be built from the current outline and measurements.
        </p>
      </section>
    )
  }

  const wallCount = geometry.walls.length
  return (
    <section
      className="room-viewer"
      aria-label="3D room viewer"
      data-orbit-enabled={orbitControlsEnabled(session) ? 'true' : 'false'}
    >
      <ViewerToolbar
        showWalls={showWalls}
        onToggleWalls={() => setShowWalls((visible) => !visible)}
        onResetCamera={() => setResetToken((token) => token + 1)}
        onTopView={() => setTopToken((token) => token + 1)}
        onReturnToEditor={onReturnToEditor}
      />
      <div className="room-viewer__columns">
        <FurnitureList session={session} onAction={onAction} />
        <div className="room-viewer__stage">
          <p className="room-viewer__summary">
            {wallCount} walls · height {formatMeters(geometry.heightMeters)} · floor{' '}
            {geometry.floorAreaSquareMeters.toFixed(2)} m²
          </p>
          <div className={`room-viewer__frame${placing ? ' room-viewer__frame--placing' : ''}`}>
            <Canvas
              className="room-viewer__canvas"
              camera={{ fov: VIEWER_FOV_DEGREES, near: 0.05, far: 200, position: [6, 6, 6] }}
              gl={{ antialias: true }}
              style={{ background: VIEWER_BACKGROUND }}
            >
              <RoomScene
                geometry={geometry}
                showWalls={showWalls}
                appearance={appearance}
                resetToken={resetToken}
                topToken={topToken}
                session={session}
                onAction={onAction}
              />
            </Canvas>
          </div>
          <p className="room-viewer__hint">
            {placing ? PLACEMENT_INSTRUCTION : 'Drag to orbit · Scroll to zoom · Right-drag or two-finger drag to pan'}
          </p>
        </div>
        <FurnitureDetails
          session={session}
          room={{
            wallCount,
            heightMeters: geometry.heightMeters,
            floorAreaSquareMeters: geometry.floorAreaSquareMeters,
          }}
          roomControls={<RoomColorsPanel appearance={appearance} onColorChange={onRoomColorChange} />}
          onAction={onAction}
        />
      </div>
    </section>
  )
}
