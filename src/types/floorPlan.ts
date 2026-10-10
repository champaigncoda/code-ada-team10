import type { Size2D } from './geometry'

/** An uploaded floor plan; `size` is its natural (original) pixel size. */
export interface FloorPlanImage {
  readonly fileName: string
  /** Object URL owned by the app; revoke it when the image is replaced. */
  readonly url: string
  readonly size: Size2D
}
