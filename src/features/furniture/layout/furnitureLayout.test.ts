import { describe, expect, it } from 'vitest'
import type { FurnitureCategory, FurnitureConfig, FurnitureDimensions } from '../../../types/furniture'
import { FURNITURE_BOUNDS_TOLERANCE, FURNITURE_DEFAULTS } from '../catalog'
import { createFurnitureConfig } from '../furnitureConfig'
import { buildFurnitureLayout } from './buildFurnitureLayout'
import { layoutBounds } from './parts'

function config(
  category: FurnitureCategory,
  dimensions: FurnitureDimensions = FURNITURE_DEFAULTS[category],
  color = '#d4c4a8',
  id = `${category}-test`,
): FurnitureConfig {
  return createFurnitureConfig({ category, dimensions, color, id })
}

function expectValidLayout(category: FurnitureCategory, dimensions: FurnitureDimensions) {
  const layout = buildFurnitureLayout(config(category, dimensions))
  expect(layout).toBeTruthy()
  if (!layout) return
  const bounds = layoutBounds(layout.parts)
  expect(bounds).toBeTruthy()
  if (!bounds) return
  expect(bounds.width).toBeCloseTo(dimensions.width, 9)
  expect(bounds.depth).toBeCloseTo(dimensions.depth, 9)
  expect(bounds.height).toBeCloseTo(dimensions.height, 9)
  expect(Math.abs(bounds.minY)).toBeLessThanOrEqual(FURNITURE_BOUNDS_TOLERANCE)
  expect(Math.abs(bounds.minX + bounds.maxX)).toBeLessThanOrEqual(FURNITURE_BOUNDS_TOLERANCE)
  expect(Math.abs(bounds.minZ + bounds.maxZ)).toBeLessThanOrEqual(FURNITURE_BOUNDS_TOLERANCE)
  for (const part of layout.parts) {
    expect(part.size.x).toBeGreaterThan(0)
    expect(part.size.y).toBeGreaterThan(0)
    expect(part.size.z).toBeGreaterThan(0)
    expect(Number.isFinite(part.size.x) && Number.isFinite(part.center.x)).toBe(true)
    expect(part.center.y - part.size.y / 2).toBeGreaterThanOrEqual(-FURNITURE_BOUNDS_TOLERANCE)
    expect(part.center.y + part.size.y / 2).toBeLessThanOrEqual(dimensions.height + FURNITURE_BOUNDS_TOLERANCE)
  }
  return layout
}

describe('furniture bounding boxes', () => {
  it.each(['sofa', 'bed', 'table'] as const)('fits a default %s inside its requested box', (category) => {
    expectValidLayout(category, FURNITURE_DEFAULTS[category])
  })

  it('matches the requested width, depth and height within a tight tolerance', () => {
    const layout = buildFurnitureLayout(config('sofa', { width: 2, depth: 0.9, height: 0.85 }))
    const bounds = layout && layoutBounds(layout.parts)
    expect(bounds?.width).toBeCloseTo(2, 9)
    expect(bounds?.depth).toBeCloseTo(0.9, 9)
    expect(bounds?.height).toBeCloseTo(0.85, 9)
  })
})

describe('parametric scaling', () => {
  it('grows sofa seat and backrest when width increases, not the arms', () => {
    const narrow = expectValidLayout('sofa', { width: 1.6, depth: 0.9, height: 0.85 })
    const wide = expectValidLayout('sofa', { width: 2.6, depth: 0.9, height: 0.85 })
    const armN = narrow?.parts.find((part) => part.name === 'left-arm')
    const armW = wide?.parts.find((part) => part.name === 'left-arm')
    const backN = narrow?.parts.find((part) => part.name === 'backrest')
    const backW = wide?.parts.find((part) => part.name === 'backrest')
    expect(armN && armW && backN && backW).toBeTruthy()
    if (!armN || !armW || !backN || !backW) return
    expect(armW.size.x).toBeCloseTo(0.13, 9)
    expect(armW.size.x - armN.size.x).toBeLessThan(0.03)
    expect(backW.size.x).toBeGreaterThan(backN.size.x + 0.9)
  })

  it('grows sofa seat depth when overall depth increases', () => {
    const shallow = expectValidLayout('sofa', { width: 2, depth: 0.75, height: 0.85 })
    const deep = expectValidLayout('sofa', { width: 2, depth: 1.2, height: 0.85 })
    const seatN = shallow?.parts.find((part) => part.name === 'seat-base')
    const seatD = deep?.parts.find((part) => part.name === 'seat-base')
    expect(seatD && seatN && seatD.size.z).toBeGreaterThan((seatN?.size.z ?? 0) + 0.3)
  })

  it('raises the sofa backrest when height increases', () => {
    const low = expectValidLayout('sofa', { width: 2, depth: 0.9, height: 0.7 })
    const tall = expectValidLayout('sofa', { width: 2, depth: 0.9, height: 1.1 })
    expect(tall?.parts.find((part) => part.name === 'backrest')?.size.y).toBeGreaterThan(
      low?.parts.find((part) => part.name === 'backrest')?.size.y ?? 0,
    )
  })

  it('widens the bed mattress and headboard together', () => {
    const twin = expectValidLayout('bed', { width: 0.9, depth: 2, height: 1 })
    const king = expectValidLayout('bed', { width: 2, depth: 2, height: 1 })
    expect(king?.parts.find((part) => part.name === 'mattress')?.size.x).toBeGreaterThan(
      (twin?.parts.find((part) => part.name === 'mattress')?.size.x ?? 0) + 0.9,
    )
    expect(king?.parts.find((part) => part.name === 'headboard')?.size.x).toBeCloseTo(2, 9)
  })

  it('lengthens the tabletop and repositions the legs when depth changes', () => {
    const short = expectValidLayout('table', { width: 1.2, depth: 0.5, height: 0.75 })
    const long = expectValidLayout('table', { width: 1.2, depth: 1.1, height: 0.75 })
    const topS = short?.parts.find((part) => part.name === 'tabletop')
    const topL = long?.parts.find((part) => part.name === 'tabletop')
    const legS = short?.parts.find((part) => part.name === 'leg-front-left')
    const legL = long?.parts.find((part) => part.name === 'leg-front-left')
    expect(topL?.size.z).toBeCloseTo(1.1, 9)
    expect(topS?.size.z).toBeCloseTo(0.5, 9)
    expect(Math.abs(legL?.center.z ?? 0)).toBeGreaterThan(Math.abs(legS?.center.z ?? 0))
  })

  it('extends table legs when height increases, keeping top thickness bounded', () => {
    const low = expectValidLayout('table', { width: 1.2, depth: 0.7, height: 0.5 })
    const tall = expectValidLayout('table', { width: 1.2, depth: 0.7, height: 1 })
    const topLow = low?.parts.find((part) => part.name === 'tabletop')
    const topTall = tall?.parts.find((part) => part.name === 'tabletop')
    const legLow = low?.parts.find((part) => part.name === 'leg-front-left')
    const legTall = tall?.parts.find((part) => part.name === 'leg-front-left')
    expect(topTall?.size.y).toBeLessThan(0.06)
    expect(topLow && topLow.center.y + topLow.size.y / 2).toBeCloseTo(0.5, 9)
    expect(legTall?.size.y).toBeGreaterThan((legLow?.size.y ?? 0) + 0.4)
  })
})

describe('supported size extremes', () => {
  it.each([
    ['sofa', { width: 0.35, depth: 0.28, height: 0.22 }, { width: 8, depth: 2.4, height: 1.4 }],
    ['bed', { width: 0.45, depth: 0.7, height: 0.35 }, { width: 4, depth: 5, height: 2 }],
    ['table', { width: 0.22, depth: 0.16, height: 0.18 }, { width: 6, depth: 2.5, height: 1.4 }],
  ] as const)('builds a valid %s at unusually small and large sizes', (category, small, large) => {
    expectValidLayout(category, small)
    expectValidLayout(category, large)
  })

  it('does not let sofa arms grow with an unusually wide seat', () => {
    const layout = expectValidLayout('sofa', { width: 8, depth: 1.2, height: 0.9 })
    expect(layout?.parts.find((part) => part.name === 'left-arm')?.size.x).toBeCloseTo(0.13, 9)
    expect(layout?.parts.filter((part) => part.name.startsWith('seat-cushion')).length).toBeGreaterThan(3)
  })

  it('rejects sizes that collapse in 32-bit rendering', () => {
    expect(buildFurnitureLayout(config('sofa', { width: 1e-320, depth: 1e-320, height: 1e-320 }))).toBeNull()
    expect(buildFurnitureLayout(config('table', { width: 1e20, depth: 1e20, height: 1e20 }))).toBeNull()
  })
})

describe('bed frame faces', () => {
  it('does not stack coplanar outer faces on the lower frame', () => {
    const layout = expectValidLayout('bed', FURNITURE_DEFAULTS.bed)
    if (!layout) return
    const shell = ['headboard', 'left-rail', 'right-rail', 'foot-rail'].map((name) => {
      const part = layout.parts.find((item) => item.name === name)
      expect(part).toBeTruthy()
      return part!
    })
    for (let index = 0; index < shell.length; index += 1) {
      for (let other = index + 1; other < shell.length; other += 1) {
        const a = shell[index]
        const b = shell[other]
        if (!a || !b) continue
        expect(boxesOverlap(a, b)).toBe(false)
      }
    }
    const platform = layout.parts.find((part) => part.name === 'platform')
    const left = layout.parts.find((part) => part.name === 'left-rail')
    expect(platform && left).toBeTruthy()
    if (!platform || !left) return
    expect(platform.center.y - platform.size.y / 2).toBeGreaterThan(0)
    expect(platform.center.x - platform.size.x / 2).toBeGreaterThan(left.center.x - left.size.x / 2)
  })
})

function boxesOverlap(
  a: { readonly center: { readonly x: number; readonly y: number; readonly z: number }; readonly size: { readonly x: number; readonly y: number; readonly z: number } },
  b: { readonly center: { readonly x: number; readonly y: number; readonly z: number }; readonly size: { readonly x: number; readonly y: number; readonly z: number } },
): boolean {
  const separated = (centerA: number, sizeA: number, centerB: number, sizeB: number) =>
    centerA + sizeA / 2 <= centerB - sizeB / 2 + 1e-8 || centerB + sizeB / 2 <= centerA - sizeA / 2 + 1e-8
  return !(
    separated(a.center.x, a.size.x, b.center.x, b.size.x) ||
    separated(a.center.y, a.size.y, b.center.y, b.size.y) ||
    separated(a.center.z, a.size.z, b.center.z, b.size.z)
  )
}

describe('grounding and origin', () => {
  it('rests every category on y = 0 and centers it on x and z', () => {
    for (const category of ['sofa', 'bed', 'table'] as const) {
      const bounds = layoutBounds(expectValidLayout(category, FURNITURE_DEFAULTS[category])?.parts ?? [])
      expect(bounds?.minY).toBeCloseTo(0, 9)
      expect((bounds?.minX ?? 1) + (bounds?.maxX ?? 1)).toBeCloseTo(0, 9)
      expect((bounds?.minZ ?? 1) + (bounds?.maxZ ?? 1)).toBeCloseTo(0, 9)
    }
  })
})
