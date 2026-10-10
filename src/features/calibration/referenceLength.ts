import { type PositiveMetersParseResult, parsePositiveMeters } from '../../utils/parsePositiveMeters'

export type ReferenceLengthParseResult = PositiveMetersParseResult

const REFERENCE_LENGTH_MESSAGES = {
  empty: "Enter the wall's actual length in meters.",
  example: '3.75',
  nonPositive: 'The length must be greater than zero.',
} as const

/** Parses the user's typed wall length. Only positive, finite meters are accepted. */
export function parseReferenceLength(input: string): ReferenceLengthParseResult {
  return parsePositiveMeters(input, REFERENCE_LENGTH_MESSAGES)
}
