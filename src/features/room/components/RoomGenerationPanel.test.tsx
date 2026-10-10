// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RoomGenerationPanel } from './RoomGenerationPanel'

afterEach(cleanup)

describe('RoomGenerationPanel', () => {
  it('disables generation until calibration is confirmed', () => {
    render(
      <RoomGenerationPanel
        heightInput="2.8"
        isCalibrationConfirmed={false}
        canGenerate={false}
        onHeightChange={() => {}}
        onGenerate={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Generate 3D Room' })).toHaveProperty('disabled', true)
    expect(screen.getByText(/confirm the room dimensions/i)).toBeTruthy()
  })

  it('shows a validation message for an invalid height', () => {
    render(
      <RoomGenerationPanel
        heightInput="0"
        isCalibrationConfirmed={true}
        canGenerate={false}
        onHeightChange={() => {}}
        onGenerate={() => {}}
      />,
    )
    expect(screen.getByText('The height must be greater than zero.')).toBeTruthy()
    expect(screen.getByLabelText('Room height').getAttribute('aria-invalid')).toBe('true')
  })

  it('enables generation when ready', () => {
    const onGenerate = vi.fn()
    render(
      <RoomGenerationPanel
        heightInput="2.8"
        isCalibrationConfirmed={true}
        canGenerate={true}
        onHeightChange={() => {}}
        onGenerate={onGenerate}
      />,
    )
    const button = screen.getByRole('button', { name: 'Generate 3D Room' })
    expect(button).toHaveProperty('disabled', false)
    fireEvent.click(button)
    expect(onGenerate).toHaveBeenCalledOnce()
  })
})
