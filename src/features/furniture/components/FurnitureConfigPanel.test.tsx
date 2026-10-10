// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { FURNITURE_DEFAULTS } from '../catalog'
import { buildFurnitureLayout } from '../layout/buildFurnitureLayout'
import { useFurnitureDraft } from '../useFurnitureDraft'
import { FurnitureConfigPanel } from './FurnitureConfigPanel'

afterEach(cleanup)

function Harness() {
  const furniture = useFurnitureDraft()
  const layout = buildFurnitureLayout(furniture.preview)
  return (
    <>
      <FurnitureConfigPanel
        draft={furniture.draft}
        onCategoryChange={furniture.selectCategory}
        onDimensionChange={furniture.changeDimension}
        onColorChange={furniture.changeColor}
      />
      <output data-testid="preview-category">{furniture.preview.category}</output>
      <output data-testid="preview-size">
        {furniture.preview.dimensions.width},{furniture.preview.dimensions.depth},{furniture.preview.dimensions.height}
      </output>
      <output data-testid="preview-color">{furniture.preview.color}</output>
      <output data-testid="part-count">{layout?.parts.length ?? 0}</output>
    </>
  )
}

describe('FurnitureConfigPanel', () => {
  it('starts on the sofa defaults', () => {
    render(<Harness />)
    expect(screen.getByTestId('preview-category').textContent).toBe('sofa')
    expect(screen.getByTestId('preview-size').textContent).toBe(
      `${FURNITURE_DEFAULTS.sofa.width},${FURNITURE_DEFAULTS.sofa.depth},${FURNITURE_DEFAULTS.sofa.height}`,
    )
  })

  it('loads bed defaults when the category changes', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Bed' }))
    expect(screen.getByTestId('preview-category').textContent).toBe('bed')
    expect(screen.getByTestId('preview-size').textContent).toBe(
      `${FURNITURE_DEFAULTS.bed.width},${FURNITURE_DEFAULTS.bed.depth},${FURNITURE_DEFAULTS.bed.height}`,
    )
  })

  it('keeps the last valid preview while a dimension is invalid, then updates again', () => {
    render(<Harness />)
    const width = screen.getByLabelText('Width')
    const partsBefore = screen.getByTestId('part-count').textContent
    fireEvent.change(width, { target: { value: '0' } })
    expect(screen.getByText(/greater than zero/i)).toBeTruthy()
    expect(screen.getByTestId('preview-size').textContent).toBe('2,0.9,0.85')
    expect(screen.getByTestId('part-count').textContent).toBe(partsBefore)

    fireEvent.change(width, { target: { value: '2.4' } })
    expect(screen.getByTestId('preview-size').textContent).toBe('2.4,0.9,0.85')
    expect(Number(screen.getByTestId('part-count').textContent)).toBeGreaterThan(0)
  })

  it('accepts a width above the old category maximum', () => {
    render(<Harness />)
    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '9' } })
    expect(screen.getByText(/overall width in meters/i)).toBeTruthy()
    expect(screen.getByTestId('preview-size').textContent).toBe('9,0.9,0.85')
    expect(Number(screen.getByTestId('part-count').textContent)).toBeGreaterThan(0)
  })

  it('explains an unbuildable size without dropping the last preview', () => {
    render(<Harness />)
    const partsBefore = screen.getByTestId('part-count').textContent
    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '1e-320' } })
    fireEvent.change(screen.getByLabelText('Depth'), { target: { value: '1e-320' } })
    fireEvent.change(screen.getByLabelText('Height'), { target: { value: '1e-320' } })
    expect(screen.getByRole('alert').textContent).toMatch(/too small/i)
    expect(screen.getByTestId('preview-size').textContent).toBe('2,0.9,0.85')
    expect(screen.getByTestId('part-count').textContent).toBe(partsBefore)
  })

  it('updates color without changing size', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Navy' }))
    expect(screen.getByTestId('preview-color').textContent).toBe('#2c3d5a')
    expect(screen.getByTestId('preview-size').textContent).toBe('2,0.9,0.85')
  })
})
