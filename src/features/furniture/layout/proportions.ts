import { clamp } from '../../../utils/math'

/**
 * Size one feature from its parent span.
 *
 * Usual sizes stay between `minAbs` and `maxAbs`. Very small spans shrink the
 * feature so it cannot exceed `maxFraction` of the parent or become negative.
 * There is no absolute maximum furniture size — only this internal proportion.
 */
export function featureSize(
  span: number,
  ratio: number,
  minAbs: number,
  maxAbs: number,
  maxFraction: number,
): number {
  if (!(span > 0) || !(maxFraction > 0) || !(maxAbs > 0)) return 0
  const cap = Math.min(maxAbs, span * maxFraction)
  if (!(cap > 0)) return 0
  const floor = Math.min(Math.max(minAbs, 0), cap)
  return clamp(span * ratio, floor, cap)
}
