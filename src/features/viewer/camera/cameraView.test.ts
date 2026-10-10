import { describe, expect, it } from 'vitest'
import { applyCameraView, computeInitialCameraView, type CameraView, type ViewCamera } from './cameraView'

function isFinitePoint(point: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)
}

interface FakeCamera extends ViewCamera {
  readonly position: { x: number; y: number; z: number; set(x: number, y: number, z: number): void }
}

function createFakeCamera(): FakeCamera {
  const position = {
    x: 99,
    y: 99,
    z: 99,
    set(x: number, y: number, z: number) {
      this.x = x
      this.y = y
      this.z = z
    },
  }
  return {
    position,
    near: 0,
    far: 0,
    lookAt() {},
    updateProjectionMatrix() {},
  }
}

describe('camera framing', () => {
  it.each([
    { name: 'a compact room', extent: { width: 3, depth: 2, height: 2.8 } },
    { name: 'a large hall', extent: { width: 40, depth: 25, height: 6 } },
    { name: 'a tall narrow shaft', extent: { width: 1.2, depth: 1.2, height: 12 } },
  ])('returns finite coordinates for $name', ({ extent }) => {
    const view = computeInitialCameraView(extent, 16 / 9)
    expect(isFinitePoint(view.position)).toBe(true)
    expect(isFinitePoint(view.target)).toBe(true)
    expect(view.position.y).toBeGreaterThan(view.target.y)
    expect(view.target).toEqual({ x: 0, y: extent.height / 2, z: 0 })
    expect(view.near).toBeGreaterThan(0)
    expect(view.far).toBeGreaterThan(view.near)
    expect(view.minDistance).toBeGreaterThan(0)
    expect(view.maxDistance).toBeGreaterThan(view.minDistance)
  })

  it('restores the initial view after the camera has been moved', () => {
    const initial = computeInitialCameraView({ width: 8, depth: 5, height: 2.8 }, 1.5)
    const camera = createFakeCamera()
    const controls = {
      target: { x: 4, y: 1, z: -3, set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z } },
      updated: false,
      update() {
        this.updated = true
      },
    }

    applyCameraView(camera, controls, initial)
    const snapshot = copyView(camera, controls)

    camera.position.set(20, 1, -8)
    camera.near = 9
    camera.far = 10
    camera.lookAt(3, 0, 3)
    controls.target.set(3, 0, 3)

    applyCameraView(camera, controls, initial)
    expect(copyView(camera, controls)).toEqual(snapshot)
    expect(controls.updated).toBe(true)
    expect(snapshot.position).toEqual(initial.position)
    expect(snapshot.target).toEqual(initial.target)
  })
})

function copyView(
  camera: ReturnType<typeof createFakeCamera>,
  controls: { target: { x: number; y: number; z: number; set(x: number, y: number, z: number): void } },
): CameraView {
  return {
    position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
    near: camera.near,
    far: camera.far,
    minDistance: 0,
    maxDistance: 0,
  }
}
