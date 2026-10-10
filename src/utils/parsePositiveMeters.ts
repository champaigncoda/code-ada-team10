export type PositiveMetersParseResult =
  | { readonly ok: true; readonly meters: number }
  | { readonly ok: false; readonly message: string }

export interface PositiveMetersMessages {
  /** Shown when the field is empty, e.g. "Enter the room height in meters." */
  readonly empty: string
  /** A sample value used in the format hints, e.g. "2.8". */
  readonly example: string
  /** Shown for zero or negative values. */
  readonly nonPositive: string
}

/** Plain decimal notation, optionally signed (so negatives get a specific message) or in exponent form. */
const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i

/** Parses a typed measurement. Only positive, finite meters are accepted, at full precision. */
export function parsePositiveMeters(input: string, messages: PositiveMetersMessages): PositiveMetersParseResult {
  const text = input.trim()
  if (text === '') {
    return { ok: false, message: messages.empty }
  }
  if (/^\d+,\d+$/.test(text)) {
    return { ok: false, message: `Use a period as the decimal separator, e.g. ${messages.example}.` }
  }
  const value = DECIMAL_PATTERN.test(text) ? Number(text) : Number.NaN
  if (!Number.isFinite(value)) {
    return { ok: false, message: `Enter a valid number, e.g. ${messages.example}.` }
  }
  if (value <= 0) {
    return { ok: false, message: messages.nonPositive }
  }
  return { ok: true, meters: value }
}
