import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { FloorPoint, RoomWall } from '../../../types/room'
import type { FloorTriangle } from './floorTriangulation'

/** Floor at y = 0 with upward normals; indices come straight from the triangulation. */
export function createFloorBufferGeometry(
  footprint: readonly FloorPoint[],
  triangles: readonly FloorTriangle[],
): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(footprint.flatMap((p) => [p.x, 0, p.z]), 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(footprint.flatMap(() => [0, 1, 0]), 3))
  geometry.setIndex(triangles.flatMap((triangle) => [...triangle]))
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * All walls as one geometry: per wall, a quad with corners
 * [start floor, end floor, end top, start top], wound so its front face
 * looks into the room. Rendered double-sided, so the outside shows too.
 */
export function createWallsBufferGeometry(walls: readonly RoomWall[]): BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  for (const { start, end, heightMeters, inwardNormal } of walls) {
    const base = positions.length / 3
    positions.push(
      start.x, 0, start.z,
      end.x, 0, end.z,
      end.x, heightMeters, end.z,
      start.x, heightMeters, start.z,
    )
    for (let corner = 0; corner < 4; corner++) normals.push(inwardNormal.x, 0, inwardNormal.z)

    // (end − start) × up points along (−dz, dx); flip the winding when that isn't the inward side.
    const facesInward = -(end.z - start.z) * inwardNormal.x + (end.x - start.x) * inwardNormal.z >= 0
    indices.push(
      ...(facesInward
        ? [base, base + 1, base + 2, base, base + 2, base + 3]
        : [base, base + 2, base + 1, base, base + 3, base + 2]),
    )
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}
