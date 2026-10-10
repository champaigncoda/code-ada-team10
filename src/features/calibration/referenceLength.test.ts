import { describe, expect, it } from 'vitest'
import { parseReferenceLength } from './referenceLength'

describe('parseReferenceLength', () => {
  it.each([
    ['3.75', 3.75],
    ['4', 4],
    [' 2.5 ', 2.5],
    ['.5', 0.5],
    ['10.', 10],
    ['0.001', 0.001],
  ])('accepts %j', (input, meters) => {
    expect(parseReferenceLength(input)).toEqual({ ok: true, meters })
  })

  it.each([
    ['empty', ''],
    ['whitespace', '   '],
    ['zero', '0'],
    ['zero decimal', '0.000'],
    ['negative', '-2'],
    ['non-numeric', 'abc'],
    ['trailing text', '3.5m'],
    ['NaN', 'NaN'],
    ['Infinity', 'Infinity'],
    ['overflow to infinity', '1e999'],
    ['comma decimal', '3,75'],
    ['hex', '0x10'],
    ['two dots', '1.2.3'],
  ])('rejects %s input with a message', (_, input) => {
    const result = parseReferenceLength(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message.length).toBeGreaterThan(0)
  })

  it('explains specific problems', () => {
    expect(parseReferenceLength('')).toMatchObject({ message: expect.stringMatching(/enter/i) })
    expect(parseReferenceLength('-1')).toMatchObject({ message: expect.stringMatching(/greater than zero/i) })
    expect(parseReferenceLength('3,75')).toMatchObject({ message: expect.stringMatching(/period/i) })
    expect(parseReferenceLength('abc')).toMatchObject({ message: expect.stringMatching(/valid number/i) })
  })
})
