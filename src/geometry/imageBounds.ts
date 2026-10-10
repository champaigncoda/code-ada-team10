import type { Point2D, Size2D } from '../types/geometry'

export function isPointInImage(point: Point2D, imageSize: Size2D): boolean {
  return point.x >= 0 && point.y >= 0 && point.x <= imageSize.width && point.y <= imageSize.height
}

export function clampPointToImage(point: Point2D, imageSize: Size2D): Point2D {
  return {
    x: Math.min(Math.max(point.x, 0), imageSize.width),
    y: Math.min(Math.max(point.y, 0), imageSize.height),
  }
}
