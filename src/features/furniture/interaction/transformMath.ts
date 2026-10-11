import type { FloorPoint } from '../../../types/room'

/** Movement below this many CSS pixels is a click, not a drag or rotation. */
export const DRAG_THRESHOLD_PX = 5

export const ROTATION_SHORTCUTS_DEGREES = [0, 90, 180, 270] as const

export type GestureClaim = 'drag' | 'rotate' | 'camera' | 'placement'

export function classifyPointerDown(input: {
  readonly button: number
  readonly placing: boolean
  readonly target: 'rotate' | 'body' | 'empty'
}): GestureClaim {
  if (input.placing) return 'placement'
  if (input.button !== 0) return 'camera'
  if (input.target === 'rotate') return 'rotate'
  if (input.target === 'body') return 'drag'
  return 'camera'
}

/** Orbit must stay off for the whole gesture once furniture owns the pointer. */
export function cameraLocked(claim: GestureClaim): boolean {
  return claim === 'drag' || claim === 'rotate' || claim === 'placement'
}

/**
 * Selection after the primary button is released.
 * A furniture press keeps that instance selected. An empty click clears it.
 * An empty drag is a camera gesture and must leave the selection alone.
 */
export function selectionAfterPrimaryRelease(input: {
  readonly downTarget: 'rotate' | 'body' | 'empty'
  readonly dragged: boolean
  readonly downId: string | null
  readonly selectedId: string | null
}): string | null {
  if (input.downTarget === 'body' || input.downTarget === 'rotate') return input.downId
  if (input.dragged) return input.selectedId
  return null
}

export function pointerTravelPx(startX: number, startY: number, x: number, y: number): number {
  return Math.hypot(x - startX, y - startY)
}

export function passedDragThreshold(startX: number, startY: number, x: number, y: number): boolean {
  return pointerTravelPx(startX, startY, x, y) >= DRAG_THRESHOLD_PX
}

/** Furniture center minus the ground hit, so the grab point stays under the cursor. */
export function grabOffset(origin: FloorPoint, hit: FloorPoint): FloorPoint {
  return { x: origin.x - hit.x, z: origin.z - hit.z }
}

export function positionFromGrab(hit: FloorPoint, offset: FloorPoint): FloorPoint {
  return { x: hit.x + offset.x, z: hit.z + offset.z }
}

/** Angle of a floor point around a center, in radians. 0 points along +Z. */
export function pointerAngleXZ(center: FloorPoint, point: FloorPoint): number {
  return Math.atan2(point.x - center.x, point.z - center.z)
}

/** Shortest signed turn from `from` to `to`, in (−π, π]. */
export function signedAngleDelta(from: number, to: number): number {
  let delta = to - from
  const fullTurn = Math.PI * 2
  delta = ((delta + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI
  return delta === -Math.PI ? Math.PI : delta
}

export function rotationFromPointer(initialRotationY: number, initialAngle: number, currentAngle: number): number {
  return initialRotationY + signedAngleDelta(initialAngle, currentAngle)
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

/** Wrap any finite angle into [0, 360). */
export function normalizeDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0
  return ((degrees % 360) + 360) % 360
}

export function formatDegrees(radians: number): string {
  const rounded = Math.round(normalizeDegrees(radiansToDegrees(radians)) * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function formatCoordinate(value: number): string {
  const rounded = Math.round(value * 1000) / 1000
  return String(rounded)
}

export type SignedParse =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly incomplete: boolean }

const SIGNED_DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)$/

/** Plain signed decimals. A trailing sign or dot is incomplete, not an error. */
export function parseSignedDecimal(input: string): SignedParse {
  const text = input.trim()
  if (text === '' || text === '+' || text === '-' || text === '.' || text === '+.' || text === '-.' || text.endsWith('.')) {
    return { ok: false, incomplete: true }
  }
  if (!SIGNED_DECIMAL.test(text)) return { ok: false, incomplete: false }
  const value = Number(text)
  if (!Number.isFinite(value)) return { ok: false, incomplete: false }
  return { ok: true, value }
}

export interface DragGesture {
  readonly id: string
  readonly startClientX: number
  readonly startClientY: number
  readonly offset: FloorPoint
  readonly active: boolean
  readonly position: FloorPoint
}

export function beginDrag(
  id: string,
  clientX: number,
  clientY: number,
  origin: FloorPoint,
  hit: FloorPoint,
): DragGesture {
  return {
    id,
    startClientX: clientX,
    startClientY: clientY,
    offset: grabOffset(origin, hit),
    active: false,
    position: origin,
  }
}

/** Keeps the last position when the ray misses. Does not move before the click/drag threshold. */
export function advanceDrag(gesture: DragGesture, clientX: number, clientY: number, hit: FloorPoint | null): DragGesture {
  const active = gesture.active || passedDragThreshold(gesture.startClientX, gesture.startClientY, clientX, clientY)
  if (!active || !hit) return active === gesture.active ? gesture : { ...gesture, active }
  const position = positionFromGrab(hit, gesture.offset)
  if (position.x === gesture.position.x && position.z === gesture.position.z && gesture.active) return gesture
  return { ...gesture, active: true, position }
}

export interface RotateGesture {
  readonly id: string
  readonly startClientX: number
  readonly startClientY: number
  readonly initialRotationY: number
  readonly initialAngle: number
  readonly active: boolean
  readonly rotationY: number
}

export function beginRotate(
  id: string,
  clientX: number,
  clientY: number,
  rotationY: number,
  center: FloorPoint,
  hit: FloorPoint,
): RotateGesture {
  return {
    id,
    startClientX: clientX,
    startClientY: clientY,
    initialRotationY: rotationY,
    initialAngle: pointerAngleXZ(center, hit),
    active: false,
    rotationY,
  }
}

export function advanceRotate(
  gesture: RotateGesture,
  clientX: number,
  clientY: number,
  center: FloorPoint,
  hit: FloorPoint | null,
): RotateGesture {
  const active = gesture.active || passedDragThreshold(gesture.startClientX, gesture.startClientY, clientX, clientY)
  if (!active || !hit) return active === gesture.active ? gesture : { ...gesture, active }
  const rotationY = rotationFromPointer(gesture.initialRotationY, gesture.initialAngle, pointerAngleXZ(center, hit))
  if (rotationY === gesture.rotationY && gesture.active) return gesture
  return { ...gesture, active: true, rotationY }
}
