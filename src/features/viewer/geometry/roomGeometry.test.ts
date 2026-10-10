import { describe, expect, it } from 'vitest'
import { RECTANGLE_PX, roomSource } from '../testFixtures'
import { buildRoomGeometry } from './roomGeometry'

describe('buildRoomGeometry', () => {
  it('does not mutate the stored outline', () => {
    const outline = RECTANGLE_PX.map((point) => ({ ...point }))
    const snapshot = outline.map((point) => ({ ...point }))
    buildRoomGeometry(roomSource(outline, 2.8))
    expect(outline).toEqual(snapshot)
  })

  it('rejects incomplete or non-positive inputs', () => {
    expect(buildRoomGeometry(roomSource(RECTANGLE_PX.slice(0, 2)))).toBeNull()
    expect(buildRoomGeometry(roomSource(RECTANGLE_PX, 0))).toBeNull()
    expect(buildRoomGeometry(roomSource(RECTANGLE_PX, 2.8, 0))).toBeNull()
  })
})
