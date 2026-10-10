import type { FurnitureColor } from '../../types/furniture'

const HEX_PATTERN = /^#([0-9a-f]{6})$/i

export function isFurnitureColor(value: string): value is FurnitureColor {
  return HEX_PATTERN.test(value.trim())
}

export function normalizeFurnitureColor(value: string): FurnitureColor | null {
  const text = value.trim()
  if (!HEX_PATTERN.test(text)) return null
  return text.toLowerCase()
}

function hexToRgb(hex: FurnitureColor): readonly [number, number, number] {
  const raw = hex.slice(1)
  return [0, 2, 4].map((offset) => Number.parseInt(raw.slice(offset, offset + 2), 16)) as [number, number, number]
}

function rgbToHex(r: number, g: number, b: number): FurnitureColor {
  const channel = (value: number) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

function mix(hex: FurnitureColor, other: FurnitureColor, amount: number): FurnitureColor {
  const a = hexToRgb(hex)
  const b = hexToRgb(other)
  return rgbToHex(a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount)
}

export interface FurniturePalette {
  readonly primary: FurnitureColor
  readonly secondary: FurnitureColor
  readonly accent: FurnitureColor
}

/** Primary is the user's color; secondary is a bit darker, accent a bit lighter. */
export function furniturePalette(color: FurnitureColor): FurniturePalette {
  const normalized = normalizeFurnitureColor(color) ?? '#d4c4a8'
  return {
    primary: normalized,
    secondary: mix(normalized, '#1d2330', 0.22),
    accent: mix(normalized, '#ffffff', 0.22),
  }
}

export function colorForRole(palette: FurniturePalette, role: 'primary' | 'secondary' | 'accent'): FurnitureColor {
  return palette[role]
}
