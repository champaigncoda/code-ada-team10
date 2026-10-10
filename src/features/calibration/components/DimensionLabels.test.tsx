// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ViewTransform } from '../../../geometry/viewTransform'
import { DIMENSION_LABEL_FONT_PX } from '../constants'
import { DimensionLabels } from './DimensionLabels'

const square = [
  { x: 100, y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: 300 },
  { x: 100, y: 300 },
]
const wallLengthsMeters = [4, 4, 4, 4]
const viewportSize = { width: 1200, height: 900 }

function renderAt(transform: ViewTransform) {
  return render(
    <DimensionLabels
      vertices={square}
      wallLengthsMeters={wallLengthsMeters}
      referenceEdgeIndex={1}
      transform={transform}
      viewportSize={viewportSize}
    />,
  )
}

function labelElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.dimension-label'))
}

afterEach(cleanup)

describe('DimensionLabels', () => {
  it('renders the same screen font size at every zoom level', () => {
    const fontSizes = [0.5, 1, 2.5].flatMap((scale) => {
      const { container, unmount } = renderAt({ scale, offset: { x: 20, y: 10 } })
      const sizes = labelElements(container).map((el) => el.style.fontSize)
      unmount()
      return sizes
    })
    expect(fontSizes.length).toBe(12)
    expect(new Set(fontSizes)).toEqual(new Set([`${DIMENSION_LABEL_FONT_PX}px`]))
  })

  it('moves labels with the view while keeping text and edge association', () => {
    const near = renderAt({ scale: 1, offset: { x: 0, y: 0 } })
    const nearLabels = labelElements(near.container).map((el) => ({ edge: el.dataset.edgeIndex, left: el.style.left, text: el.textContent }))
    near.unmount()

    const far = renderAt({ scale: 2, offset: { x: 50, y: 40 } })
    const farLabels = labelElements(far.container).map((el) => ({ edge: el.dataset.edgeIndex, left: el.style.left, text: el.textContent }))

    expect(farLabels.map((l) => [l.edge, l.text])).toEqual(nearLabels.map((l) => [l.edge, l.text]))
    // Edge 0's midpoint (200, 100) maps to x = 200 * scale + offset.x on screen.
    expect(nearLabels[0]?.left).toBe('200px')
    expect(farLabels[0]?.left).toBe('450px')
  })

  it('marks the reference wall and stays out of assistive tech and pointer hit-testing', () => {
    const { container } = renderAt({ scale: 1, offset: { x: 0, y: 0 } })
    const overlay = container.querySelector('.dimension-labels')
    expect(overlay?.getAttribute('aria-hidden')).toBe('true')
    const reference = labelElements(container).filter((el) => el.classList.contains('dimension-label--reference'))
    expect(reference.map((el) => el.dataset.edgeIndex)).toEqual(['1'])
  })
})
