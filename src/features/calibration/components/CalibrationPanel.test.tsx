// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useReducer } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { editorReducer } from '../../editor/editorReducer'
import { createClosedState } from '../../editor/editorTestUtils'
import { selectCanConfirmCalibration, selectIsReadyFor3D, selectWallLengthsMeters } from '../../editor/editorSelectors'
import { getReferenceEdgeIndex } from '../calibrationState'
import { CalibrationPanel } from './CalibrationPanel'

/** Wires the panel to the real reducer so the test exercises the full calibration workflow. */
function CalibrationHarness() {
  const [state, dispatch] = useReducer(editorReducer, undefined, () => createClosedState())
  return (
    <>
      <CalibrationPanel
        isPolygonClosed={state.isClosed}
        vertexCount={state.polygon.vertices.length}
        status={state.calibration.status}
        referenceEdgeIndex={getReferenceEdgeIndex(state.calibration)}
        lengthInput={state.calibration.lengthInput}
        wallLengthsMeters={selectWallLengthsMeters(state)}
        canConfirm={selectCanConfirmCalibration(state)}
        onSelectWall={(edgeIndex) => dispatch({ type: 'referenceEdgeSelected', edgeIndex })}
        onLengthChange={(input) => dispatch({ type: 'referenceLengthChanged', input })}
        onConfirm={() => dispatch({ type: 'calibrationConfirmed' })}
        onRecalibrate={() => dispatch({ type: 'recalibrationStarted' })}
      />
      <output data-testid="ready">{String(selectIsReadyFor3D(state))}</output>
    </>
  )
}

function wallButton(name: RegExp): HTMLElement {
  return screen.getByRole('button', { name })
}

afterEach(cleanup)

describe('CalibrationPanel', () => {
  it('explains that the outline must be closed first', () => {
    render(
      <CalibrationPanel
        isPolygonClosed={false}
        vertexCount={2}
        status="uncalibrated"
        referenceEdgeIndex={null}
        lengthInput=""
        wallLengthsMeters={null}
        canConfirm={false}
        onSelectWall={() => {}}
        onLengthChange={() => {}}
        onConfirm={() => {}}
        onRecalibrate={() => {}}
      />,
    )
    expect(screen.getByText(/close the room outline/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /confirm dimensions/i })).toBeNull()
  })

  it('runs the full select → measure → confirm → re-calibrate workflow', () => {
    render(<CalibrationHarness />)
    expect(screen.getByText('Select a wall to set its actual length.')).toBeTruthy()
    const confirm = screen.getByRole('button', { name: 'Confirm Dimensions' })
    expect(confirm).toHaveProperty('disabled', true)

    fireEvent.click(wallButton(/^Wall 1/))
    const input = screen.getByLabelText('Actual length of Wall 1')
    expect(screen.getByText(/Reference wall:/).textContent).toContain('Wall 1')

    fireEvent.change(input, { target: { value: '-2' } })
    expect(screen.getByText('The length must be greater than zero.')).toBeTruthy()
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(confirm).toHaveProperty('disabled', true)
    expect(wallButton(/^Wall 2/).textContent).toContain('—')

    fireEvent.change(input, { target: { value: '4' } })
    expect(confirm).toHaveProperty('disabled', false)
    expect(wallButton(/^Wall 2/).textContent).toContain('3.00 m')
    expect(screen.getByTestId('calibration-status').textContent).toBe('Review dimensions')

    fireEvent.click(confirm)
    expect(screen.getByTestId('calibration-status').textContent).toContain('Confirmed')
    expect(screen.getByText(/Dimensions confirmed\./).getAttribute('role')).toBe('status')
    expect(screen.getByTestId('ready').textContent).toBe('true')
    expect(screen.getByLabelText('Actual length of Wall 1')).toHaveProperty('disabled', true)
    expect(wallButton(/^Wall 2/)).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: 'Re-calibrate' }))
    expect(screen.getByTestId('ready').textContent).toBe('false')
    const unlocked = screen.getByLabelText('Actual length of Wall 1')
    expect(unlocked).toHaveProperty('disabled', false)
    expect((unlocked as HTMLInputElement).value).toBe('4')
  })

  it('clears the measurement when a different wall is chosen', () => {
    render(<CalibrationHarness />)
    fireEvent.click(wallButton(/^Wall 1/))
    fireEvent.change(screen.getByLabelText('Actual length of Wall 1'), { target: { value: '4' } })
    fireEvent.click(wallButton(/^Wall 2/))

    const input = screen.getByLabelText('Actual length of Wall 2') as HTMLInputElement
    expect(input.value).toBe('')
    expect(screen.getByRole('button', { name: 'Confirm Dimensions' })).toHaveProperty('disabled', true)
    expect(wallButton(/^Wall 1/).textContent).toContain('—')
  })
})
