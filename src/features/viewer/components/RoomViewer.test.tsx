// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useReducer } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PLACEMENT_INSTRUCTION, initialFurnitureSession, reduceFurnitureSession } from '../../furniture/session/furnitureSession'
import { roomSource, RECTANGLE_PX } from '../testFixtures'
import { RoomViewer } from './RoomViewer'

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="room-canvas" />,
}))

afterEach(cleanup)

function Harness() {
  const [session, dispatch] = useReducer(reduceFurnitureSession, initialFurnitureSession())
  return (
    <RoomViewer
      source={roomSource(RECTANGLE_PX, 2.8)}
      session={session}
      onAction={dispatch}
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
})
