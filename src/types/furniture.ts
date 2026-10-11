import type { Point3D } from './room'

export type FurnitureCategory = 'sofa' | 'bed' | 'table' | 'chair' | 'cabinet'

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

/**
 * One placed piece. `category` is the furniture type. Position is the model's
 * bottom-center on the floor, in the same meters as the room. Rotation is
 * radians around Y; Phase 5A always stores 0 until rotation is edited later.
 */
export interface FurnitureInstance {
  readonly id: string
  readonly category: FurnitureCategory
  readonly dimensions: FurnitureDimensions
  readonly color: FurnitureColor
  readonly position: {
    readonly x: number
    readonly z: number
  }
  readonly rotationY: number
  /** Shown instead of the automatic "Sofa 1" label. Omitted when the user has not named it. */
  readonly customName?: string
}
