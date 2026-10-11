import { describe, expect, it } from 'vitest'
import { Mesh, Raycaster, SphereGeometry, Vector3, type Intersection, type Object3D } from 'three'

describe('furniture raycast restore', () => {
  it('hits again after a no-op raycast is replaced with the mesh prototype', () => {
    const mesh = new Mesh(new SphereGeometry(1, 8, 8))
    mesh.updateMatrixWorld()
    const raycaster = new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1).normalize())
    const blocked: Intersection<Object3D>[] = []
    mesh.raycast = () => undefined
    mesh.raycast(raycaster, blocked)
    expect(blocked).toHaveLength(0)

    mesh.raycast = Mesh.prototype.raycast
    const hits: Intersection<Object3D>[] = []
    mesh.raycast(raycaster, hits)
    expect(hits.length).toBeGreaterThan(0)
  })
})
