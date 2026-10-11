import type { RoomAppearance, RoomColor, RoomSurface } from '../../types/room'

export interface RoomColorPreset {
  readonly name: string
  readonly value: RoomColor
}

/** First entry is the default, matching the viewer's original floor color. */
export const FLOOR_COLOR_PRESETS: readonly RoomColorPreset[] = [
  { name: 'Slate', value: '#6d7583' },
  { name: 'Light Oak', value: '#c8a97e' },
  { name: 'Birch', value: '#e3cba5' },
  { name: 'Walnut', value: '#6b4a2f' },
  { name: 'Espresso', value: '#3b2a20' },
  { name: 'Gray Tile', value: '#bfc1c2' },
  { name: 'White Tile', value: '#f5f5f2' },
]

/** First entry is the default, matching the viewer's original wall color. */
export const WALL_COLOR_PRESETS: readonly RoomColorPreset[] = [
  { name: 'Soft White', value: '#f7f3eb' },
  { name: 'Warm White', value: '#f2ebdd' },
  { name: 'Beige', value: '#d9cbb3' },
  { name: 'Light Gray', value: '#bfc1c2' },
  { name: 'Sage Green', value: '#9caf88' },
  { name: 'Dusty Blue', value: '#8a9bb0' },
]

export const DEFAULT_ROOM_APPEARANCE: RoomAppearance = {
  floorColor: '#6d7583',
  wallColor: '#f7f3eb',
}

const HEX_PATTERN = /^#[0-9a-f]{6}$/i

/** Returns the lowercase `#rrggbb` form, or null when the input is not a 6-digit hex color. */
export function normalizeRoomColor(value: string): RoomColor | null {
  const text = value.trim()
  return HEX_PATTERN.test(text) ? text.toLowerCase() : null
}

export function roomColorPresets(surface: RoomSurface): readonly RoomColorPreset[] {
  return surface === 'floor' ? FLOOR_COLOR_PRESETS : WALL_COLOR_PRESETS
}

export function roomColorFor(appearance: RoomAppearance, surface: RoomSurface): RoomColor {
  return surface === 'floor' ? appearance.floorColor : appearance.wallColor
}

/**
 * Applies a color to one surface. Invalid input, or a color equal to the
 * current one, returns the same object so callers can skip a re-render.
 */
export function changeRoomColor(appearance: RoomAppearance, surface: RoomSurface, input: string): RoomAppearance {
  const color = normalizeRoomColor(input)
  if (!color || color === roomColorFor(appearance, surface)) return appearance
  return surface === 'floor' ? { ...appearance, floorColor: color } : { ...appearance, wallColor: color }
}
