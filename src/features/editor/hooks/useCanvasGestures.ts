import { type MouseEvent, type PointerEvent, useRef, useState } from 'react'
import { distance } from '../../../geometry/point'
import type { Point2D } from '../../../types/geometry'
import { CLICK_MOVE_TOLERANCE_PX } from '../constants'

const LEFT_BUTTON = 0
const MIDDLE_BUTTON = 1

type Gesture =
  | { readonly kind: 'pan'; readonly pointerId: number; readonly last: Point2D }
  | { readonly kind: 'click'; readonly pointerId: number; readonly start: Point2D }

interface CanvasGestureOptions {
  readonly isSpaceHeld: boolean
  readonly onClick: (screen: Point2D) => void
  readonly onPan: (screenDelta: Point2D) => void
  readonly onHover: (screen: Point2D | null) => void
}

function toLocalPoint(event: PointerEvent<HTMLElement>): Point2D {
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

/**
 * Separates clicks from pans. Space + left drag or middle drag pans; a left
 * press without Space becomes a click only if released without moving, so
 * panning or stray drags never create vertices.
 */
export function useCanvasGestures({ isSpaceHeld, onClick, onPan, onHover }: CanvasGestureOptions) {
  const gestureRef = useRef<Gesture | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  function endGesture() {
    gestureRef.current = null
    setIsPanning(false)
  }

  const handlers = {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (gestureRef.current) return
      const point = toLocalPoint(event)
      if (event.button === MIDDLE_BUTTON || (event.button === LEFT_BUTTON && isSpaceHeld)) {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        gestureRef.current = { kind: 'pan', pointerId: event.pointerId, last: point }
        setIsPanning(true)
      } else if (event.button === LEFT_BUTTON) {
        gestureRef.current = { kind: 'click', pointerId: event.pointerId, start: point }
      }
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const point = toLocalPoint(event)
      onHover(point)
      const gesture = gestureRef.current
      if (!gesture || gesture.pointerId !== event.pointerId) return
      if (gesture.kind === 'pan') {
        onPan({ x: point.x - gesture.last.x, y: point.y - gesture.last.y })
        gestureRef.current = { ...gesture, last: point }
      } else if (distance(point, gesture.start) > CLICK_MOVE_TOLERANCE_PX) {
        gestureRef.current = null
      }
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const gesture = gestureRef.current
      if (!gesture || gesture.pointerId !== event.pointerId) return
      endGesture()
      if (gesture.kind === 'click' && !isSpaceHeld) {
        onClick(gesture.start)
      }
    },
    onPointerCancel: endGesture,
    onPointerLeave() {
      if (!gestureRef.current) onHover(null)
    },
    onMouseDown(event: MouseEvent<HTMLElement>) {
      // Stops the browser's middle-click autoscroll from starting.
      if (event.button === MIDDLE_BUTTON) event.preventDefault()
    },
  }

  return { handlers, isPanning }
}
