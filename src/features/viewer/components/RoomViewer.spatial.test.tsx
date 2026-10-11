// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useReducer, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RoomAppearance } from '../../../types/room'
import {
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

function placed(id: string, x: number, z: number, session = initialFurnitureSession()): FurnitureSession {
  return apply(
    session,
    { type: 'furnitureCreateStarted' },
    { type: 'furniturePlacementStarted' },
    { type: 'furniturePlacementAttempted', position: { x, z }, inside: true, id },
  )
}

function Harness({ initial }: { readonly initial: FurnitureSession }) {
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

describe('spatial warnings in the viewer', () => {
  it('shows no warnings for a sofa inside the room, then updates as it is moved out and back', () => {
    render(<Harness initial={placed('sofa-1', 0, 0)} />)
    expect(screen.getByRole('heading', { name: 'Spatial Warnings' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Room colors' })).toBeNull()
    expect(screen.getByText('No spatial warnings.')).toBeTruthy()
    expect(screen.queryByRole('img', { name: 'Out of bounds' })).toBeNull()

    fireEvent.change(screen.getByLabelText('Position X'), { target: { value: '1.8' } })
    expect(screen.getByRole('heading', { name: 'Out of Bounds' })).toBeTruthy()
    expect(screen.getByText('Part of this furniture extends beyond the room boundary.')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Out of bounds' })).toBeTruthy()
    expect(screen.queryByText('No spatial warnings.')).toBeNull()

    fireEvent.change(screen.getByLabelText('Position X'), { target: { value: '0' } })
    expect(screen.getByText('No spatial warnings.')).toBeTruthy()
    expect(screen.queryByRole('img', { name: 'Out of bounds' })).toBeNull()
  })

  it('shows overlap on both items, keeps both messages when also out of bounds, and clears a deleted partner', () => {
    const initial = placed('sofa-2', 1.7, 0, placed('sofa-1', 1.8, 0))
    render(<Harness initial={initial} />)

    expect(screen.getByRole('heading', { name: 'Out of Bounds' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Furniture Overlap' })).toBeTruthy()
    expect(screen.getByText('This furniture overlaps with Sofa 1.')).toBeTruthy()
    expect(screen.getAllByRole('img', { name: 'Out of bounds' })).toHaveLength(2)
    expect(screen.getAllByRole('img', { name: 'Overlaps other furniture' })).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: /Sofa 1/ }))
    expect(screen.getByText('This furniture overlaps with Sofa 2.')).toBeTruthy()
    expect(screen.queryByText('This furniture overlaps with Sofa 1.')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Sofa 2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByRole('img', { name: 'Overlaps other furniture' })).toBeNull()
    expect(screen.getByRole('img', { name: 'Out of bounds' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Sofa 1/ }))
    expect(screen.queryByRole('heading', { name: 'Furniture Overlap' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Out of Bounds' })).toBeTruthy()
  })

  it('shows room colors again after the last item is deleted and keeps the chosen color', () => {
    render(<Harness initial={placed('sofa-1', 1.8, 0)} />)
    expect(screen.getByRole('heading', { name: 'Out of Bounds' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Room colors' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByRole('heading', { name: 'Spatial Warnings' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Room colors' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Walls: Dusty Blue' }))
    expect(screen.getByRole('button', { name: 'Walls: Dusty Blue' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Floor: Slate' }).getAttribute('aria-pressed')).toBe('true')
  })
})
