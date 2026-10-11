// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RoomAppearance } from '../../../types/room'
import { DEFAULT_ROOM_APPEARANCE, WALL_COLOR_PRESETS, changeRoomColor } from '../appearance'
import { RoomColorsPanel } from './RoomColorsPanel'

afterEach(cleanup)

function Harness() {
  const [appearance, setAppearance] = useState<RoomAppearance>(DEFAULT_ROOM_APPEARANCE)
  return (
    <RoomColorsPanel
      appearance={appearance}
      onColorChange={(surface, color) => setAppearance((current) => changeRoomColor(current, surface, color))}
    />
  )
}

const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed')

describe('RoomColorsPanel', () => {
  it('marks the default floor and wall presets as selected', () => {
    render(<Harness />)
    expect(pressed('Floor: Slate')).toBe('true')
    expect(pressed('Walls: Soft White')).toBe('true')
    expect(pressed('Floor: Light Oak')).toBe('false')
  })

  it('reports the surface and color of a clicked preset', () => {
    const onColorChange = vi.fn()
    render(<RoomColorsPanel appearance={DEFAULT_ROOM_APPEARANCE} onColorChange={onColorChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Floor: Walnut' }))
    fireEvent.click(screen.getByRole('button', { name: 'Walls: Sage Green' }))
    expect(onColorChange).toHaveBeenNthCalledWith(1, 'floor', '#6b4a2f')
    expect(onColorChange).toHaveBeenNthCalledWith(2, 'wall', '#9caf88')
  })

  it('updates the selection and custom value as colors change', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Floor: Light Oak' }))
    expect(pressed('Floor: Light Oak')).toBe('true')
    expect(pressed('Floor: Slate')).toBe('false')
    expect(screen.getByLabelText('Custom floor color')).toHaveProperty('value', '#c8a97e')

    fireEvent.change(screen.getByLabelText('Custom wall color'), { target: { value: '#123456' } })
    expect(screen.getByLabelText('Custom wall color')).toHaveProperty('value', '#123456')
    expect(screen.getByText('#123456')).toBeTruthy()
    expect(WALL_COLOR_PRESETS.every((preset) => pressed(`Walls: ${preset.name}`) === 'false')).toBe(true)
  })
})
