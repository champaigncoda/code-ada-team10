import type { FurnitureInstance } from '../../types/furniture'
import type { FloorPoint } from '../../types/room'

/**
 * A point on the floor in world meters. `FloorPoint` is the same frame:
 * +X is image-right, +Z is image-down, and the furniture origin is the
 * bottom center.
 */
export type PointXZ = FloorPoint

/**
 * Three.js rotation about Y (right-handed, column vectors):
 *   x' =  x cos θ + z sin θ
 *   z' = −x sin θ + z cos θ
 * This is the matrix `Object3D.rotation.y` applies to local furniture vertices.
 * It is not the standard XY-plane formula `x' = x cos θ − y sin θ`.
 */
export function rotateXZ(x: number, z: number, rotationY: number): PointXZ {
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  return {
    x: x * cos + z * sin,
    z: -x * sin + z * cos,
  }
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value)
}

/**
 * World-space corners of the furniture's ground rectangle, in this order:
 * (−width/2, −depth/2), (+width/2, −depth/2), (+width/2, +depth/2), (−width/2, +depth/2),
 * then rotated by `rotationY` and translated by the bottom-center position.
 * Height is ignored. Returns null for non-positive or non-finite inputs.
 * Does not mutate `furniture`.
 */
export function getFurnitureFootprint(furniture: FurnitureInstance): PointXZ[] | null {
  const { width, depth } = furniture.dimensions
  const { x, z } = furniture.position
  const { rotationY } = furniture
  if (!isPositiveFinite(width) || !isPositiveFinite(depth)) return null
  if (!isFiniteNumber(x) || !isFiniteNumber(z) || !isFiniteNumber(rotationY)) return null

  const halfWidth = width / 2
  const halfDepth = depth / 2
  const localCorners: readonly (readonly [number, number])[] = [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth],
  ]
  const corners = localCorners.map(([localX, localZ]) => {
    const rotated = rotateXZ(localX, localZ, rotationY)
    return { x: x + rotated.x, z: z + rotated.z }
  })
  if (corners.some((corner) => !isFiniteNumber(corner.x) || !isFiniteNumber(corner.z))) return null
  return corners
}
