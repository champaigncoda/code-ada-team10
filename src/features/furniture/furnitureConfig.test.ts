import { describe, expect, it } from 'vitest'
import { FURNITURE_DEFAULTS } from './catalog'
import {
  changeFurnitureCategory,
  changeFurnitureDimension,
  createFurnitureConfig,
  describeUnbuildableFurniture,
  draftFromDefaults,
  parseFurnitureDimension,
  parseFurnitureDraft,
  resolveFurniturePreview,
} from './furnitureConfig'
import { buildFurnitureLayout } from './layout/buildFurnitureLayout'

describe('furniture configuration', () => {
  it.each(['sofa', 'bed', 'table'] as const)('loads default dimensions for a %s', (category) => {
    const draft = draftFromDefaults(category)
    expect(parseFurnitureDraft(draft)?.dimensions).toEqual(FURNITURE_DEFAULTS[category])
  })

  it('rejects zero, negative, empty, nonnumeric and non-finite dimensions', () => {
    expect(parseFurnitureDimension('0', 'sofa', 'width').ok).toBe(false)
    expect(parseFurnitureDimension('-1', 'sofa', 'depth').ok).toBe(false)
    expect(parseFurnitureDimension('', 'bed', 'height').ok).toBe(false)
    expect(parseFurnitureDimension('abc', 'table', 'width').ok).toBe(false)
    expect(parseFurnitureDimension('NaN', 'bed', 'depth').ok).toBe(false)
    expect(parseFurnitureDimension('Infinity', 'sofa', 'height').ok).toBe(false)
  })

  it('accepts unusually large finite dimensions', () => {
    const parsed = parseFurnitureDimension('12.5', 'sofa', 'width')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.meters).toBe(12.5)
    const draft = {
      ...draftFromDefaults('table'),
      widthInput: '8',
      depthInput: '3',
      heightInput: '1.5',
    }
    expect(parseFurnitureDraft(draft)?.dimensions).toEqual({ width: 8, depth: 3, height: 1.5 })
    expect(buildFurnitureLayout(parseFurnitureDraft(draft)!)).toBeTruthy()
  })

  it('explains dimensions that cannot be assembled and keeps the last preview', () => {
    const valid = draftFromDefaults('sofa')
    const last = parseFurnitureDraft(valid)
    expect(last).toBeTruthy()
    if (!last) return
    const tiny = { ...valid, widthInput: '1e-320', depthInput: '1e-320', heightInput: '1e-320' }
    expect(describeUnbuildableFurniture(tiny)).toMatch(/too small to build a recognizable sofa/i)
    expect(resolveFurniturePreview(tiny, last)).toEqual(last)
    const huge = { ...valid, widthInput: '1e20', depthInput: '1e20', heightInput: '1e20' }
    expect(describeUnbuildableFurniture(huge)).toMatch(/too large to build a stable sofa/i)
    expect(resolveFurniturePreview(huge, last)).toEqual(last)
    expect(buildFurnitureLayout(resolveFurniturePreview(huge, last))).toBeTruthy()
  })

  it('resets dimensions when the category changes and keeps the color', () => {
    const sofa = changeFurnitureDimension(draftFromDefaults('sofa', '#2c3d5a'), 'width', '2.4')
    const bed = changeFurnitureCategory(sofa, 'bed')
    expect(bed.category).toBe('bed')
    expect(bed.color).toBe('#2c3d5a')
    expect(parseFurnitureDraft(bed)?.dimensions).toEqual(FURNITURE_DEFAULTS.bed)
  })

  it('does not change geometry when only the color changes', () => {
    const beige = createFurnitureConfig({
      category: 'sofa',
      dimensions: FURNITURE_DEFAULTS.sofa,
      color: '#d4c4a8',
      id: 'sofa-a',
    })
    const navy = { ...beige, color: '#2c3d5a' }
    const a = buildFurnitureLayout(beige)
    const b = buildFurnitureLayout(navy)
    expect(a?.parts).toEqual(b?.parts)
    expect(a?.dimensions).toEqual(b?.dimensions)
  })

  it('does not generate geometry from invalid dimensions', () => {
    expect(
      buildFurnitureLayout(
        createFurnitureConfig({ category: 'table', dimensions: { width: 0, depth: 0.7, height: 0.75 }, color: '#d4c4a8' }),
      ),
    ).toBeNull()
    expect(parseFurnitureDraft(changeFurnitureDimension(draftFromDefaults(), 'width', 'abc'))).toBeNull()
  })

  it('keeps the last valid preview while the input is invalid, then restores generation', () => {
    const valid = draftFromDefaults('table')
    const last = parseFurnitureDraft(valid)
    expect(last).toBeTruthy()
    if (!last) return
    const invalid = changeFurnitureDimension(valid, 'height', '0')
    expect(parseFurnitureDraft(invalid)).toBeNull()
    expect(resolveFurniturePreview(invalid, last)).toEqual(last)
    expect(buildFurnitureLayout(resolveFurniturePreview(invalid, last))).toBeTruthy()

    const restored = changeFurnitureDimension(invalid, 'height', '0.8')
    const next = resolveFurniturePreview(restored, last)
    expect(next.dimensions.height).toBe(0.8)
    expect(buildFurnitureLayout(next)?.dimensions.height).toBe(0.8)
  })
})

describe('multiple independent instances', () => {
  it('lets two sofas have different sizes and colors without sharing objects', () => {
    const first = createFurnitureConfig({
      category: 'sofa',
      dimensions: { width: 1.8, depth: 0.85, height: 0.8 },
      color: '#8b9099',
      id: 'sofa-1',
    })
    const second = createFurnitureConfig({
      category: 'sofa',
      dimensions: { width: 2.4, depth: 1, height: 0.9 },
      color: '#6b7c4f',
      id: 'sofa-2',
    })
    expect(first.id).not.toBe(second.id)
    expect(first.dimensions).not.toBe(second.dimensions)
    expect(first.color).not.toBe(second.color)

    const mutated = { ...first, color: '#c46b4a', dimensions: { ...first.dimensions, width: 3 } }
    expect(second.color).toBe('#6b7c4f')
    expect(second.dimensions.width).toBe(2.4)
    expect(first.color).toBe('#8b9099')
    expect(mutated.id).toBe(first.id)
  })

  it('builds the same layout for identical valid inputs', () => {
    const input = { category: 'bed' as const, dimensions: FURNITURE_DEFAULTS.bed, color: '#d4c4a8' as const }
    const a = buildFurnitureLayout(createFurnitureConfig({ ...input, id: 'a' }))
    const b = buildFurnitureLayout(createFurnitureConfig({ ...input, id: 'b' }))
    expect(a?.parts).toEqual(b?.parts)
  })
})
