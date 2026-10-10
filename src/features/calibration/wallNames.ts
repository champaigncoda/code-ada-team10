/** 1-based names match the vertex numbering used in validation messages. */
export function wallName(edgeIndex: number): string {
  return `Wall ${edgeIndex + 1}`
}

export function wallVertexRange(edgeIndex: number, vertexCount: number): string {
  return `vertex ${edgeIndex + 1} → ${((edgeIndex + 1) % vertexCount) + 1}`
}
