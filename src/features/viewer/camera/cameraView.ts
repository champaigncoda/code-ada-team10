import type { Point3D } from '../../../types/room'

export const VIEWER_FOV_DEGREES = 45

/** Elevated three-quarter view: high enough to see the floor over the near walls. */
const VIEW_ELEVATION_RADIANS = (50 * Math.PI) / 180
const VIEW_AZIMUTH_RADIANS = (35 * Math.PI) / 180
const FRAMING_MARGIN = 1.15

export interface RoomExtent {
  readonly width: number
  readonly depth: number
  readonly height: number
}

export interface CameraView {
  readonly position: Point3D
  readonly target: Point3D
  readonly near: number
  readonly far: number
  readonly minDistance: number
  readonly maxDistance: number
}

/** Anything with an orbit target, such as Drei's OrbitControls. */
export interface OrbitTargetControls {
  readonly target: { set(x: number, y: number, z: number): unknown }
  update(): unknown
}

/** The parts of a THREE.PerspectiveCamera this module drives. */
export interface ViewCamera {
  readonly position: { set(x: number, y: number, z: number): unknown }
  near: number
  far: number
  lookAt(x: number, y: number, z: number): void
  updateProjectionMatrix(): void
}

function positiveOr(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/**
 * Frames the room's bounding box (centered on the origin, floor at y = 0)
 * from an elevated corner. The distance fits the bounding sphere inside the
 * narrower of the vertical and horizontal fields of view, and clip planes
 * scale with it so tiny and very large rooms both render.
 */
export function computeInitialCameraView(
  extent: RoomExtent,
  aspect: number,
  fovDegrees: number = VIEWER_FOV_DEGREES,
): CameraView {
  const width = positiveOr(extent.width, 1)
  const depth = positiveOr(extent.depth, 1)
  const height = positiveOr(extent.height, 1)
  const safeAspect = positiveOr(aspect, 1)

  const radius = Math.hypot(width, depth, height) / 2
  const verticalFov = (positiveOr(fovDegrees, VIEWER_FOV_DEGREES) * Math.PI) / 180
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * safeAspect)
  const distance = (radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2)) * FRAMING_MARGIN

  const target = { x: 0, y: height / 2, z: 0 }
  const horizontal = distance * Math.cos(VIEW_ELEVATION_RADIANS)
  return {
    target,
    position: {
      x: target.x + horizontal * Math.sin(VIEW_AZIMUTH_RADIANS),
      y: target.y + distance * Math.sin(VIEW_ELEVATION_RADIANS),
      z: target.z + horizontal * Math.cos(VIEW_AZIMUTH_RADIANS),
    },
    near: distance / 1000,
    far: distance * 20,
    minDistance: radius * 0.05,
    maxDistance: distance * 6,
  }
}

/** Puts the camera (and orbit target, if controls exist) exactly into `view`. */
export function applyCameraView(camera: ViewCamera, controls: OrbitTargetControls | null, view: CameraView): void {
  const { position, target } = view
  camera.position.set(position.x, position.y, position.z)
  camera.near = view.near
  camera.far = view.far
  camera.lookAt(target.x, target.y, target.z)
  camera.updateProjectionMatrix()
  if (controls) {
    controls.target.set(target.x, target.y, target.z)
    controls.update()
  }
}
