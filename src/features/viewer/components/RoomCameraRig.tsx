import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type { PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { RoomExtent } from '../camera/cameraView'
import { applyCameraView, computeInitialCameraView, VIEWER_FOV_DEGREES } from '../camera/cameraView'

interface RoomCameraRigProps {
  readonly extent: RoomExtent
  /** Increment to snap the camera back to the computed initial view. */
  readonly resetToken: number
  /** Placement mode turns orbit, pan, and zoom off until it ends or the view unmounts. */
  readonly enabled?: boolean
}

export function RoomCameraRig({ extent, resetToken, enabled = true }: RoomCameraRigProps) {
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

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={enabled}
      enablePan={enabled}
      enableZoom={enabled}
      enableRotate={enabled}
      minDistance={view.minDistance}
      maxDistance={view.maxDistance}
      target={orbitTarget}
    />
  )
}
