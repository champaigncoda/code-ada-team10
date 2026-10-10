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
}

export function RoomCameraRig({ extent, resetToken }: RoomCameraRigProps) {
  const camera = useThree((state) => state.camera)
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1))
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const view = useMemo(() => computeInitialCameraView(extent, aspect, VIEWER_FOV_DEGREES), [extent, aspect])

  useLayoutEffect(() => {
    applyCameraView(camera as PerspectiveCamera, controlsRef.current, view)
  }, [camera, view, resetToken])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={view.minDistance}
      maxDistance={view.maxDistance}
      target={[view.target.x, view.target.y, view.target.z]}
    />
  )
}
