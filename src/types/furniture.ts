import type { Point3D } from './room'

export type FurnitureCategory = 'sofa' | 'bed' | 'table'

export type FurnitureDimensionAxis = 'width' | 'depth' | 'height'

/** Overall external size of the complete model, in meters. */
export interface FurnitureDimensions {
  readonly width: number
  readonly depth: number
  readonly height: number
}

/** `#rrggbb` hex color applied to the furniture's primary surfaces. */
export type FurnitureColor = string

/**
 * Everything needed to rebuild a furniture model. Placement (X, Z, yaw) is
 * intentionally omitted so Phase 5 can attach it per instance without
 * changing this configuration.
 */
export interface FurnitureConfig {
  readonly id: string
  readonly category: FurnitureCategory
  readonly dimensions: FurnitureDimensions
  readonly color: FurnitureColor
}

export type FurniturePartRole = 'primary' | 'secondary' | 'accent'

/** An axis-aligned box in the furniture's local frame (meters). */
export interface FurniturePart {
  readonly name: string
  readonly size: Point3D
  readonly center: Point3D
  readonly radius: number
  readonly role: FurniturePartRole
}

export interface FurnitureLayout {
  readonly category: FurnitureCategory
  readonly dimensions: FurnitureDimensions
  readonly parts: readonly FurniturePart[]
}

/** Future Phase 5 placement. Not used for preview. */
export interface FurniturePlacement {
  readonly x: number
  readonly z: number
  readonly rotationY: number
}

export interface DimensionLimits {
  readonly min: number
  readonly max: number
}

export interface FurnitureCategoryLimits {
  readonly width: DimensionLimits
  readonly depth: DimensionLimits
  readonly height: DimensionLimits
}
