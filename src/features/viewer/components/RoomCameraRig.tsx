import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type { PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { RoomExtent } from '../camera/cameraView'
import {
  applyCameraView,
  applyTopDownView,
  computeInitialCameraView,
  computeTopDownCameraView,
  VIEWER_FOV_DEGREES,
} from '../camera/cameraView'
import type { FloorBounds } from '../../../types/room'

interface RoomCameraRigProps {
  readonly extent: RoomExtent
  /** Increment to snap the camera back to the computed initial view. */
  readonly resetToken: number
  /** Increment to frame the room from directly above. */
  readonly topToken: number
  readonly floorBounds: FloorBounds
  /** Placement mode turns orbit, pan, and zoom off until it ends or the view unmounts. */
  readonly enabled?: boolean
}

export function RoomCameraRig({ extent, resetToken, topToken, floorBounds, enabled = true }: RoomCameraRigProps) {
  const camera = useThree((state) => state.camera)
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1))
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { width, depth, height } = extent
  // Depend on the measurements, not the extent object. Furniture updates pass a
  // new object every render; treating that as a new room was snapping the camera.
  const view = useMemo(
    () => computeInitialCameraView({ width, depth, height }, aspect, VIEWER_FOV_DEGREES),
    [width, depth, height, aspect],
  )
  const orbitTarget = useMemo(
    () => [view.target.x, view.target.y, view.target.z] as [number, number, number],
    [view.target.x, view.target.y, view.target.z],
  )

  useLayoutEffect(() => {
    applyCameraView(camera as PerspectiveCamera, controlsRef.current, view)
  }, [camera, view, resetToken])

  const { minX, maxX, minZ, maxZ } = floorBounds
  useLayoutEffect(() => {
    if (topToken === 0) return
    const top = computeTopDownCameraView({ minX, maxX, minZ, maxZ }, aspect, VIEWER_FOV_DEGREES)
    applyTopDownView(camera as PerspectiveCamera, controlsRef.current, top)
  }, [aspect, camera, minX, maxX, minZ, maxZ, topToken])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={enabled}
      enablePan={enabled}
      enableZoom={enabled}
      enableRotate={enabled}
      target={orbitTarget}
    />
  )
}
