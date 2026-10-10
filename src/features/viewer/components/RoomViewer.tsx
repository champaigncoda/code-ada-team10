import { Canvas } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import type { RoomModelSource } from '../../../types/room'
import { formatMeters } from '../../calibration/scale'
import { VIEWER_FOV_DEGREES } from '../camera/cameraView'
import { buildRoomGeometry } from '../geometry/roomGeometry'
import { VIEWER_BACKGROUND } from '../materials'
import { RoomScene } from './RoomScene'
import { ViewerToolbar } from './ViewerToolbar'
import './RoomViewer.css'

interface RoomViewerProps {
  readonly source: RoomModelSource
  readonly onReturnToEditor: () => void
}

export function RoomViewer({ source, onReturnToEditor }: RoomViewerProps) {
  const [showWalls, setShowWalls] = useState(true)
  const [resetToken, setResetToken] = useState(0)
  const geometry = useMemo(() => buildRoomGeometry(source), [source])

  if (!geometry) {
    return (
      <section className="room-viewer" aria-label="3D room viewer">
        <ViewerToolbar
          showWalls={showWalls}
          onToggleWalls={() => setShowWalls((visible) => !visible)}
          onResetCamera={() => setResetToken((token) => token + 1)}
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
    <section className="room-viewer" aria-label="3D room viewer">
      <ViewerToolbar
        showWalls={showWalls}
        onToggleWalls={() => setShowWalls((visible) => !visible)}
        onResetCamera={() => setResetToken((token) => token + 1)}
        onReturnToEditor={onReturnToEditor}
      />
      <p className="room-viewer__summary">
        {wallCount} walls · height {formatMeters(geometry.heightMeters)} · floor{' '}
        {geometry.floorAreaSquareMeters.toFixed(2)} m²
      </p>
      <div className="room-viewer__frame">
        <Canvas
          className="room-viewer__canvas"
          camera={{ fov: VIEWER_FOV_DEGREES, near: 0.05, far: 200, position: [6, 6, 6] }}
          gl={{ antialias: true }}
          style={{ background: VIEWER_BACKGROUND }}
        >
          <RoomScene geometry={geometry} showWalls={showWalls} resetToken={resetToken} />
        </Canvas>
      </div>
      <p className="room-viewer__hint">
        Drag to orbit · Scroll to zoom · Right-drag or two-finger drag to pan
      </p>
    </section>
  )
}
