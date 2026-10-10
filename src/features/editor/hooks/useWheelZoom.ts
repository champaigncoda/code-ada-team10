import { type RefObject, useEffect, useEffectEvent } from 'react'
import type { Point2D } from '../../../types/geometry'

const ZOOM_SENSITIVITY = 0.0015
const LINE_HEIGHT_PX = 16

/** Converts a wheel event into a multiplicative zoom factor (>1 zooms in). */
function wheelZoomFactor(event: WheelEvent): number {
  const deltaPx = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * LINE_HEIGHT_PX : event.deltaY
  return Math.exp(-deltaPx * ZOOM_SENSITIVITY)
}

/**
 * Calls `onZoom` with the cursor position (element-relative CSS pixels) for
 * each wheel event. Registered as a non-passive listener so the page doesn't
 * scroll while zooming.
 */
export function useWheelZoom(
  ref: RefObject<HTMLElement | null>,
  onZoom: (anchor: Point2D, factor: number) => void,
): void {
  const handleZoom = useEffectEvent(onZoom)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      handleZoom({ x: event.clientX - rect.left, y: event.clientY - rect.top }, wheelZoomFactor(event))
    }
    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel)
  }, [ref])
}
