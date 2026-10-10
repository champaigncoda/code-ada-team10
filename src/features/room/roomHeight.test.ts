import { describe, expect, it } from 'vitest'
import { DEFAULT_ROOM_HEIGHT_INPUT, parseRoomHeight } from './roomHeight'

describe('parseRoomHeight', () => {
  it('defaults to 2.8 meters', () => {
    expect(parseRoomHeight(DEFAULT_ROOM_HEIGHT_INPUT)).toEqual({ ok: true, meters: 2.8 })
  })

  it('keeps full precision', () => {
    expect(parseRoomHeight('2.8125')).toEqual({ ok: true, meters: 2.8125 })
  })

  it.each(['', '   ', '0', '-1', 'abc', 'NaN', 'Infinity', '2,8'])('rejects %j', (input) => {
    const result = parseRoomHeight(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message.length).toBeGreaterThan(0)
  })
})
