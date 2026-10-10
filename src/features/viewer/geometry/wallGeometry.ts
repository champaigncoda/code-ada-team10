import { signedArea } from '../../../geometry/polygon'
import type { FloorPoint, RoomWall } from '../../../types/room'
import { floorPointsAsPlanar } from './roomCoordinates'

/**
 * One vertical wall per footprint edge, including the closing edge from the
 * last vertex back to the first. Consecutive walls share their end/start
 * point exactly, so corners meet without gaps.
 */
export function buildRoomWalls(footprint: readonly FloorPoint[], heightMeters: number): RoomWall[] {
  // Same orientation rule as the 2D dimension labels: the sign of the
  // shoelace area tells which side of each edge is the interior.
  const orientation = Math.sign(signedArea(floorPointsAsPlanar(footprint))) || 1
  return footprint.map((start, index) => {
    const end = footprint[(index + 1) % footprint.length] ?? start
    const dx = end.x - start.x
    const dz = end.z - start.z
    const lengthMeters = Math.hypot(dx, dz)
    const inwardNormal =
      lengthMeters > 0 ? { x: (orientation * -dz) / lengthMeters, z: (orientation * dx) / lengthMeters } : { x: 0, z: 0 }
    return { index, start, end, lengthMeters, heightMeters, inwardNormal }
  })
}
