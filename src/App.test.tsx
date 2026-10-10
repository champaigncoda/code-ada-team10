// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { isFurnitureStudioRequested } from './features/app/workspace'

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="furniture-canvas" />,
}))

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('workspace navigation', () => {
  it('shows the room editor without a furniture tab', () => {
    render(<App />)
    expect(screen.getByText(/upload a floor plan to get started/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Furniture' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Furniture' })).toBeNull()
  })

  it('opens the development furniture studio without unmounting the room editor', () => {
    window.history.replaceState({}, '', '/?studio=furniture')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Furniture' })).toBeTruthy()
    expect(screen.getByLabelText('Width')).toHaveProperty('value', '2')
    expect(screen.getByText('Sofa · 2.00 m × 0.90 m × 0.85 m')).toBeTruthy()
    expect(screen.getByText(/upload a floor plan to get started/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Back to room' }))
    expect(screen.queryByRole('heading', { name: 'Furniture' })).toBeNull()
    expect(screen.getByLabelText('2D floor plan editor')).toBeTruthy()
  })
})

describe('furniture studio entry', () => {
  it('recognizes the query and hash entry points', () => {
    expect(isFurnitureStudioRequested({ search: '?studio=furniture', hash: '' })).toBe(true)
    expect(isFurnitureStudioRequested({ search: '', hash: '#furniture-studio' })).toBe(true)
    expect(isFurnitureStudioRequested({ search: '', hash: '' })).toBe(false)
  })
})
