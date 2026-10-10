import type { Point2D } from '../../types/geometry'
import type { RoomModelSource } from '../../types/room'

/** 400×300 px rectangle; bbox center is (300, 250). */
export const RECTANGLE_PX: readonly Point2D[] = [
  { x: 100, y: 100 },
  { x: 500, y: 100 },
  { x: 500, y: 400 },
  { x: 100, y: 400 },
]

/** L-shape: 400×400 outer square minus a 200×200 notch. Center is (300, 300). */
export const L_SHAPE_PX: readonly Point2D[] = [
  { x: 100, y: 100 },
  { x: 500, y: 100 },
  { x: 500, y: 300 },
  { x: 300, y: 300 },
  { x: 300, y: 500 },
  { x: 100, y: 500 },
]

/** One diagonal edge (vertex 0 → 1). */
export const DIAGONAL_ROOM_PX: readonly Point2D[] = [
  { x: 100, y: 200 },
  { x: 400, y: 100 },
  { x: 400, y: 400 },
  { x: 100, y: 400 },
]

export const METERS_PER_PIXEL = 0.01

export function roomSource(
  outline: readonly Point2D[],
  heightMeters = 2.8,
  metersPerPixel = METERS_PER_PIXEL,
): RoomModelSource {
  return { outline, metersPerPixel, heightMeters }
}

export function reverseOutline(outline: readonly Point2D[]): Point2D[] {
  return [outline[0], ...outline.slice(1).reverse()].filter((point): point is Point2D => point !== undefined)
}
