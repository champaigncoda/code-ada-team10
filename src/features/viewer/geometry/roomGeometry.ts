import { signedArea } from '../../../geometry/polygon'
import type { RoomGeometry, RoomModelSource } from '../../../types/room'
import { triangulateFootprint } from './floorTriangulation'
import { floorBounds, outlineToFloorFootprint } from './roomCoordinates'
import { buildRoomWalls } from './wallGeometry'

/**
 * Derives the complete 3D room from the canonical outline, scale and
 * height. Returns null for inputs that cannot form a room, so callers never
 * render geometry built from invalid numbers.
 */
export function buildRoomGeometry({ outline, metersPerPixel, heightMeters }: RoomModelSource): RoomGeometry | null {
  if (outline.length < 3) return null
  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) return null
  if (!Number.isFinite(heightMeters) || heightMeters <= 0) return null

  const footprint = outlineToFloorFootprint(outline, metersPerPixel)
  return {
    footprint,
    floorTriangles: triangulateFootprint(footprint),
    walls: buildRoomWalls(footprint, heightMeters),
    bounds: floorBounds(footprint),
    heightMeters,
    floorAreaSquareMeters: Math.abs(signedArea(outline)) * metersPerPixel ** 2,
  }
}
