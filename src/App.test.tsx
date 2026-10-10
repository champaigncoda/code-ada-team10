// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="furniture-canvas" />,
}))

afterEach(cleanup)

describe('workspace navigation', () => {
  it('opens the furniture preview without unmounting the room editor', () => {
    render(<App />)
    expect(screen.getByText(/upload a floor plan to get started/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Furniture' }))
    expect(screen.getByRole('heading', { name: 'Furniture' })).toBeTruthy()
    expect(screen.getByLabelText('Width')).toHaveProperty('value', '2')
    expect(screen.getByText(/upload a floor plan to get started/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Room' }))
    expect(screen.getByLabelText('2D floor plan editor')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Furniture' })).toBeNull()
  })

  it('uses meters in the furniture preview, matching the room viewer', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Furniture' }))
    expect(screen.getByText('Sofa · 2.00 m × 0.90 m × 0.85 m')).toBeTruthy()
    expect(screen.getAllByText('m').length).toBeGreaterThan(0)
  })
})
