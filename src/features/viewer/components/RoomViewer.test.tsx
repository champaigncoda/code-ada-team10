// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useReducer, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RoomAppearance } from '../../../types/room'
import {
  PLACEMENT_INSTRUCTION,
  initialFurnitureSession,
  reduceFurnitureSession,
  type FurnitureSession,
  type FurnitureSessionAction,
} from '../../furniture/session/furnitureSession'
import { DEFAULT_ROOM_APPEARANCE, changeRoomColor } from '../../room/appearance'
import { roomSource, RECTANGLE_PX } from '../testFixtures'
import { RoomViewer } from './RoomViewer'

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="room-canvas" />,
}))

afterEach(cleanup)

function apply(session: FurnitureSession, ...actions: FurnitureSessionAction[]): FurnitureSession {
  return actions.reduce(reduceFurnitureSession, session)
}

function Harness({ initial = initialFurnitureSession() }: { readonly initial?: FurnitureSession }) {
  const [session, dispatch] = useReducer(reduceFurnitureSession, initial)
  const [appearance, setAppearance] = useState<RoomAppearance>(DEFAULT_ROOM_APPEARANCE)
  return (
    <RoomViewer
      source={roomSource(RECTANGLE_PX, 2.8)}
      session={session}
      appearance={appearance}
      onAction={dispatch}
      onRoomColorChange={(surface, color) => setAppearance((current) => changeRoomColor(current, surface, color))}
      onReturnToEditor={() => undefined}
    />
  )
}

describe('room viewer furniture workspace', () => {
  it('creates, places, cancels, and restores orbit without adding an instance on cancel', () => {
    render(<Harness />)
    expect(screen.getByText('Select a furniture item or add a new one.')).toBeTruthy()
    expect(screen.getByText('No furniture in this room yet.')).toBeTruthy()
    expect(screen.getByLabelText('3D room viewer').getAttribute('data-orbit-enabled')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Add New Furniture' }))
    expect(screen.getByLabelText('Width')).toHaveProperty('value', '2')
    fireEvent.click(screen.getByRole('button', { name: 'Place in Room' }))
    expect(screen.getAllByText(PLACEMENT_INSTRUCTION).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('3D room viewer').getAttribute('data-orbit-enabled')).toBe('false')
    expect((screen.getByRole('button', { name: 'Add New Furniture' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Sofa 1' })).toBeNull()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByLabelText('3D room viewer').getAttribute('data-orbit-enabled')).toBe('true')
    expect(screen.getByRole('button', { name: 'Place in Room' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Sofa 1' })).toBeNull()
  })

  it('shows room color controls while nothing is selected and applies a picked color', () => {
    render(<Harness />)
    expect(screen.getByRole('region', { name: 'Room colors' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Floor: Light Oak' }))
    expect(screen.getByRole('button', { name: 'Floor: Light Oak' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Walls: Dusty Blue' }))
    expect(screen.getByRole('button', { name: 'Walls: Dusty Blue' }).getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Add New Furniture' }))
    expect(screen.queryByRole('region', { name: 'Room colors' })).toBeNull()
  })

  it('shows a custom name in the list and details and updates it while typing', () => {
    const named = apply(
      initialFurnitureSession(),
      { type: 'furnitureCreateStarted' },
      { type: 'furniturePlacementStarted' },
      { type: 'furniturePlacementAttempted', position: { x: 0, z: 0 }, inside: true, id: 'sofa-1' },
      { type: 'furnitureNameChanged', input: 'Reading nook' },
    )
    render(<Harness initial={named} />)
    expect(screen.getAllByText('Reading nook').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Reading nook/ })).toBeTruthy()
    expect(screen.getByLabelText('Name')).toHaveProperty('value', 'Reading nook')

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Window seat' } })
    expect(screen.getByRole('button', { name: /Window seat/ })).toBeTruthy()
    expect(screen.getAllByText('Window seat').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /Reading nook/ })).toBeNull()

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'x'.repeat(41) } })
    expect(screen.getByText('Name must be 40 characters or fewer.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Window seat/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByRole('button', { name: /Sofa 1/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()
  })

  it('shows the next automatic name as the placeholder while creating', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Add New Furniture' }))
    const name = screen.getByLabelText('Name')
    expect(name).toHaveProperty('value', '')
    expect(name).toHaveProperty('placeholder', 'Sofa 1')
  })
})
