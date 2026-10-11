// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { buildRoomGeometry } from '../geometry/roomGeometry'
import { RECTANGLE_PX, roomSource } from '../testFixtures'
import { ViewerToolbar } from './ViewerToolbar'

afterEach(cleanup)

function ViewerChrome() {
  const [showWalls, setShowWalls] = useState(true)
  const geometry = buildRoomGeometry(roomSource(RECTANGLE_PX, 2.8))
  return (
    <>
      <ViewerToolbar
        showWalls={showWalls}
        onToggleWalls={() => setShowWalls((visible) => !visible)}
        onResetCamera={() => {}}
        onTopView={() => {}}
        onReturnToEditor={() => {}}
      />
      <output data-testid="walls-visible">{String(showWalls)}</output>
      <output data-testid="wall-count">{geometry?.walls.length ?? 0}</output>
      <output data-testid="height">{geometry?.heightMeters ?? 0}</output>
    </>
  )
}

describe('ViewerToolbar', () => {
  it('toggles wall visibility without changing the generated geometry', () => {
    render(<ViewerChrome />)
    const toggle = screen.getByRole('button', { name: 'Hide Walls' })
    expect(screen.getByTestId('walls-visible').textContent).toBe('true')
    expect(screen.getByTestId('wall-count').textContent).toBe('4')
    expect(screen.getByTestId('height').textContent).toBe('2.8')

    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Show Walls' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByTestId('walls-visible').textContent).toBe('false')
    expect(screen.getByTestId('wall-count').textContent).toBe('4')
    expect(screen.getByTestId('height').textContent).toBe('2.8')
  })
})
