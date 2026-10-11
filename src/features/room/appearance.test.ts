import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ROOM_APPEARANCE,
  FLOOR_COLOR_PRESETS,
  WALL_COLOR_PRESETS,
  changeRoomColor,
  normalizeRoomColor,
  roomColorFor,
  roomColorPresets,
} from './appearance'

describe('room appearance', () => {
  it('defaults to the first floor and wall presets', () => {
    expect(DEFAULT_ROOM_APPEARANCE.floorColor).toBe(FLOOR_COLOR_PRESETS[0]?.value)
    expect(DEFAULT_ROOM_APPEARANCE.wallColor).toBe(WALL_COLOR_PRESETS[0]?.value)
  })

  it('stores every preset as a valid lowercase hex color', () => {
    for (const preset of [...FLOOR_COLOR_PRESETS, ...WALL_COLOR_PRESETS]) {
      expect(normalizeRoomColor(preset.value)).toBe(preset.value)
    }
  })

  it('normalizes hex input and rejects anything else', () => {
    expect(normalizeRoomColor(' #C8A97E ')).toBe('#c8a97e')
    expect(normalizeRoomColor('#fff')).toBeNull()
    expect(normalizeRoomColor('c8a97e')).toBeNull()
    expect(normalizeRoomColor('#zzzzzz')).toBeNull()
    expect(normalizeRoomColor('')).toBeNull()
  })

  it('returns the presets and current color for each surface', () => {
    expect(roomColorPresets('floor')).toBe(FLOOR_COLOR_PRESETS)
    expect(roomColorPresets('wall')).toBe(WALL_COLOR_PRESETS)
    expect(roomColorFor(DEFAULT_ROOM_APPEARANCE, 'floor')).toBe('#6d7583')
    expect(roomColorFor(DEFAULT_ROOM_APPEARANCE, 'wall')).toBe('#f7f3eb')
  })

  it('changes only the requested surface', () => {
    const floor = changeRoomColor(DEFAULT_ROOM_APPEARANCE, 'floor', '#C8A97E')
    expect(floor).toEqual({ floorColor: '#c8a97e', wallColor: '#f7f3eb' })
    const wall = changeRoomColor(floor, 'wall', '#9caf88')
    expect(wall).toEqual({ floorColor: '#c8a97e', wallColor: '#9caf88' })
  })

  it('keeps the same object for invalid or unchanged colors', () => {
    expect(changeRoomColor(DEFAULT_ROOM_APPEARANCE, 'floor', 'not a color')).toBe(DEFAULT_ROOM_APPEARANCE)
    expect(changeRoomColor(DEFAULT_ROOM_APPEARANCE, 'wall', '#F7F3EB')).toBe(DEFAULT_ROOM_APPEARANCE)
  })
})
