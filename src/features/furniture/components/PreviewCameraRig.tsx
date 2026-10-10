import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type { PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  applyCameraView,
  computeInitialCameraView,
  VIEWER_FOV_DEGREES,
  type RoomExtent,
} from '../../viewer/camera/cameraView'

interface PreviewCameraRigProps {
  readonly extent: RoomExtent
  readonly resetToken: number
}

export function PreviewCameraRig({ extent, resetToken }: PreviewCameraRigProps) {
  const camera = useThree((state) => state.camera)
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1))
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const view = useMemo(() => {
    const framed = computeInitialCameraView(extent, aspect, VIEWER_FOV_DEGREES)
    const distance = Math.hypot(
      framed.position.x - framed.target.x,
      framed.position.y - framed.target.y,
      framed.position.z - framed.target.z,
    )
    // Tighter than the room viewer's clip planes, and still wide enough for orbit.
    // A very small near plane makes the floor shimmer against the furniture bottom.
    return {
      ...framed,
      near: Math.min(distance / 80, framed.minDistance * 0.5),
      far: framed.maxDistance * 2,
    }
  }, [extent, aspect])

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
