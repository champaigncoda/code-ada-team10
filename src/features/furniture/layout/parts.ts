import type { FurniturePart, FurniturePartRole } from '../../../types/furniture'
import type { Point3D } from '../../../types/room'
import { clamp } from '../../../utils/math'

export function furniturePart(
  name: string,
  size: Point3D,
  center: Point3D,
  role: FurniturePartRole,
  radius = 0,
): FurniturePart | null {
  if (![size.x, size.y, size.z, center.x, center.y, center.z, radius].every(Number.isFinite)) return null
  if (size.x <= 0 || size.y <= 0 || size.z <= 0 || radius < 0) return null
  const maxRadius = Math.min(size.x, size.y, size.z) / 2
  return { name, size, center, role, radius: clamp(radius, 0, maxRadius * 0.92) }
}

/** Build a part from inclusive min/max extents so outer faces can land on the requested box. */
export function partFromExtents(
  name: string,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minZ: number,
  maxZ: number,
  role: FurniturePartRole,
  radius = 0,
): FurniturePart | null {
  return furniturePart(
    name,
    { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
    { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 },
    role,
    radius,
  )
}

export function collectParts(parts: readonly (FurniturePart | null)[]): FurniturePart[] | null {
  const present: FurniturePart[] = []
  for (const part of parts) {
    if (!part) return null
    present.push(part)
  }
  return present
}

export interface LayoutBounds {
  readonly minX: number
  readonly maxX: number
  readonly minY: number
  readonly maxY: number
  readonly minZ: number
  readonly maxZ: number
  readonly width: number
  readonly depth: number
  readonly height: number
}

export function layoutBounds(parts: readonly FurniturePart[]): LayoutBounds | null {
  if (parts.length === 0) return null
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const part of parts) {
    minX = Math.min(minX, part.center.x - part.size.x / 2)
    maxX = Math.max(maxX, part.center.x + part.size.x / 2)
    minY = Math.min(minY, part.center.y - part.size.y / 2)
    maxY = Math.max(maxY, part.center.y + part.size.y / 2)
    minZ = Math.min(minZ, part.center.z - part.size.z / 2)
    maxZ = Math.max(maxZ, part.center.z + part.size.z / 2)
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    height: maxY - minY,
  }
}
