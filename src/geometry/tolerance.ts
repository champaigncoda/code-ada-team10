/**
 * Distance, in image pixels, below which two points are considered identical
 * and a point is considered to lie on a line. Far below one pixel, so it only
 * absorbs floating-point noise and never merges distinct user clicks.
 */
export const DISTANCE_EPSILON = 1e-6
