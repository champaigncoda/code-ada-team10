export type ReferenceLengthParseResult =
  | { readonly ok: true; readonly meters: number }
  | { readonly ok: false; readonly message: string }

/** Plain decimal notation, optionally signed (so negatives get a specific message) or in exponent form. */
const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i

/** Parses the user's typed wall length. Only positive, finite meters are accepted. */
export function parseReferenceLength(input: string): ReferenceLengthParseResult {
  const text = input.trim()
  if (text === '') {
    return { ok: false, message: "Enter the wall's actual length in meters." }
  }
  if (/^\d+,\d+$/.test(text)) {
    return { ok: false, message: 'Use a period as the decimal separator, e.g. 3.75.' }
  }
  const value = DECIMAL_PATTERN.test(text) ? Number(text) : Number.NaN
  if (!Number.isFinite(value)) {
    return { ok: false, message: 'Enter a valid number, e.g. 3.75.' }
  }
  if (value <= 0) {
    return { ok: false, message: 'The length must be greater than zero.' }
  }
  return { ok: true, meters: value }
}
