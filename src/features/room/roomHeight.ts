import { type PositiveMetersParseResult, parsePositiveMeters } from '../../utils/parsePositiveMeters'

export const DEFAULT_ROOM_HEIGHT_INPUT = '2.8'

const ROOM_HEIGHT_MESSAGES = {
  empty: 'Enter the room height in meters.',
  example: '2.8',
  nonPositive: 'The height must be greater than zero.',
} as const

/** Parses the typed wall height. The value is used unrounded for geometry. */
export function parseRoomHeight(input: string): PositiveMetersParseResult {
  return parsePositiveMeters(input, ROOM_HEIGHT_MESSAGES)
}
