import type { Point2D } from '../types/geometry'
import { areEdgesAdjacent, getEdge, perimeter, signedArea } from './polygon'
import { pointsCoincide } from './point'
import { classifySegmentIntersection, orientation } from './segment'
import { DISTANCE_EPSILON } from './tolerance'

export type PolygonIssueCode =
  | 'TOO_FEW_VERTICES'
  | 'DUPLICATE_ADJACENT_VERTICES'
  | 'REPEATED_VERTEX'
  | 'ZERO_AREA'
  | 'SELF_INTERSECTION'
  | 'OVERLAPPING_EDGES'

export interface PolygonIssue {
  readonly code: PolygonIssueCode
  readonly message: string
}

export type PolygonValidationResult =
  | { readonly isValid: true }
  | { readonly isValid: false; readonly issues: readonly PolygonIssue[] }

const MIN_VERTICES = 3

/** 1-based labels match what users see when counting the corners they placed. */
function vertexLabel(index: number): string {
  return `${index + 1}`
}

function edgeLabel(index: number, vertexCount: number): string {
  return `${vertexLabel(index)}–${vertexLabel((index + 1) % vertexCount)}`
}

function findDuplicateAdjacentVertices(vertices: readonly Point2D[]): PolygonIssue | null {
  const n = vertices.length
  for (let i = 0; i < n; i++) {
    const [start, end] = getEdge(vertices, i)
    if (pointsCoincide(start, end)) {
      return {
        code: 'DUPLICATE_ADJACENT_VERTICES',
        message: `Vertices ${vertexLabel(i)} and ${vertexLabel((i + 1) % n)} are at the same position, creating a zero-length edge.`,
      }
    }
  }
  return null
}

function countDistinctVertices(vertices: readonly Point2D[]): number {
  const distinct: Point2D[] = []
  for (const vertex of vertices) {
    if (!distinct.some((other) => pointsCoincide(vertex, other))) {
      distinct.push(vertex)
    }
  }
  return distinct.length
}

function findRepeatedVertex(vertices: readonly Point2D[]): PolygonIssue | null {
  const n = vertices.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      const a = vertices[i]
      const b = vertices[j]
      if (a && b && pointsCoincide(a, b)) {
        return {
          code: 'REPEATED_VERTEX',
          message: `Vertices ${vertexLabel(i)} and ${vertexLabel(j)} are at the same position, so the outline touches itself.`,
        }
      }
    }
  }
  return null
}

function hasZeroArea(vertices: readonly Point2D[]): boolean {
  // A sliver of width w has area ≈ w * perimeter / 2, so this flags outlines thinner than ~DISTANCE_EPSILON.
  return Math.abs(signedArea(vertices)) <= DISTANCE_EPSILON * perimeter(vertices)
}

/** Adjacent edges a→b and b→c overlap when c doubles back along a→b. */
function doAdjacentEdgesOverlap(a: Point2D, b: Point2D, c: Point2D): boolean {
  if (orientation(a, b, c) !== 0) return false
  return (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y) > 0
}

function findEdgeIntersections(vertices: readonly Point2D[]): PolygonIssue[] {
  const n = vertices.length
  let crossing: PolygonIssue | null = null
  let overlap: PolygonIssue | null = null

  for (let i = 0; i < n; i++) {
    const [a1, a2] = getEdge(vertices, i)
    for (let j = i + 1; j < n; j++) {
      const [b1, b2] = getEdge(vertices, j)

      if (areEdgesAdjacent(i, j, n)) {
        const isFoldBack = j === i + 1 ? doAdjacentEdgesOverlap(a1, a2, b2) : doAdjacentEdgesOverlap(b1, b2, a2)
        if (isFoldBack && !overlap) {
          overlap = {
            code: 'OVERLAPPING_EDGES',
            message: `Edges ${edgeLabel(i, n)} and ${edgeLabel(j, n)} fold back over each other.`,
          }
        }
        continue
      }

      const kind = classifySegmentIntersection(a1, a2, b1, b2)
      if (kind === 'overlap' && !overlap) {
        overlap = {
          code: 'OVERLAPPING_EDGES',
          message: `Edges ${edgeLabel(i, n)} and ${edgeLabel(j, n)} overlap along the same line.`,
        }
      } else if ((kind === 'cross' || kind === 'touch') && !crossing) {
        crossing = {
          code: 'SELF_INTERSECTION',
          message: `Edges ${edgeLabel(i, n)} and ${edgeLabel(j, n)} ${kind === 'cross' ? 'cross' : 'touch'} each other.`,
        }
      }
    }
  }
  return [crossing, overlap].filter((issue): issue is PolygonIssue => issue !== null)
}

/**
 * Checks that the vertices (implicitly closed) form a simple polygon with
 * nonzero area. Reports at most one issue per code so messages stay readable.
 * Never modifies the input.
 */
export function validatePolygon(vertices: readonly Point2D[]): PolygonValidationResult {
  if (vertices.length < MIN_VERTICES) {
    return {
      isValid: false,
      issues: [{ code: 'TOO_FEW_VERTICES', message: `A room needs at least ${MIN_VERTICES} corners; only ${vertices.length} placed.` }],
    }
  }

  const issues: PolygonIssue[] = []
  const duplicate = findDuplicateAdjacentVertices(vertices)
  if (duplicate) issues.push(duplicate)

  if (countDistinctVertices(vertices) < MIN_VERTICES) {
    issues.push({ code: 'TOO_FEW_VERTICES', message: `A room needs at least ${MIN_VERTICES} distinct corners.` })
    return { isValid: false, issues }
  }

  const repeated = findRepeatedVertex(vertices)
  if (repeated) issues.push(repeated)

  if (hasZeroArea(vertices)) {
    issues.push({ code: 'ZERO_AREA', message: 'The outline encloses no area; all corners lie on a single line.' })
  }

  if (!duplicate) {
    issues.push(...findEdgeIntersections(vertices))
  }

  return issues.length === 0 ? { isValid: true } : { isValid: false, issues }
}
