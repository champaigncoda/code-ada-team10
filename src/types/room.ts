import type { Point2D } from './geometry'

/**
 * A point on the floor plane in meters. The floor lies at y = 0, so only the
 * two horizontal axes are stored: +x follows the image's +x (right) and +z
 * follows the image's +y (down), which keeps a top-down view unmirrored.
 */
export interface FloorPoint {
  readonly x: number
  readonly z: number
}

export interface Point3D {
  readonly x: number
  readonly y: number
  readonly z: number
}

/**
 * The minimal inputs a 3D room is derived from. Nothing here is a copy of
 * editable data: `outline` is the editor's own vertex array (image pixels),
 * and the scale and height come from the confirmed calibration and the
 * validated height input.
 */
export interface RoomModelSource {
  readonly outline: readonly Point2D[]
  readonly metersPerPixel: number
  readonly heightMeters: number
}

/** A zero-thickness vertical wall along footprint edge `index` (vertex i → i + 1). */
export interface RoomWall {
  readonly index: number
  readonly start: FloorPoint
  readonly end: FloorPoint
  readonly lengthMeters: number
  readonly heightMeters: number
  /** Unit horizontal normal pointing into the room. */
  readonly inwardNormal: FloorPoint
}

export interface FloorBounds {
  readonly minX: number
  readonly maxX: number
  readonly minZ: number
  readonly maxZ: number
  readonly width: number
  readonly depth: number
}

/** A generated room in meters, centered on the origin in the XZ plane. */
export interface RoomGeometry {
  readonly footprint: readonly FloorPoint[]
  /** Floor triangles as indices into `footprint`, each wound to face +y. */
  readonly floorTriangles: readonly (readonly [number, number, number])[]
  readonly walls: readonly RoomWall[]
  readonly bounds: FloorBounds
  readonly heightMeters: number
  readonly floorAreaSquareMeters: number
}
