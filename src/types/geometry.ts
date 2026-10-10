/**
 * A point in the original floor-plan image's pixel space.
 * Origin is the image's top-left corner; +x points right, +y points down.
 * Independent of canvas zoom/pan, so stored points stay stable across views.
 */
export interface Point2D {
  readonly x: number
  readonly y: number
}

export interface Size2D {
  readonly width: number
  readonly height: number
}

/**
 * A room outline in image pixel coordinates.
 * Vertices are ordered and implicitly closed: the last vertex connects back
 * to the first, so the first vertex is not repeated at the end.
 */
export interface RoomPolygon {
  readonly vertices: readonly Point2D[]
}
