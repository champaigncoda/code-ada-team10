import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Object3D } from 'three'
import { Raycaster, Vector2 } from 'three'
import type { FurnitureInstance } from '../../../types/furniture'
import {
  advanceDrag,
  advanceRotate,
  beginDrag,
  beginRotate,
  classifyPointerDown,
  passedDragThreshold,
  type DragGesture,
  type RotateGesture,
} from '../../furniture/interaction/transformMath'
import { rayHitFloorY0 } from '../../furniture/placement/floorPlacement'

interface FurnitureGestureControllerProps {
  readonly placing: boolean
  readonly instances: readonly FurnitureInstance[]
  readonly onSelect: (id: string) => void
  readonly onMove: (id: string, x: number, z: number) => void
  readonly onRotate: (id: string, rotationY: number) => void
  readonly onEmptyClick: () => void
}

type LiveGesture =
  | { readonly kind: 'drag'; readonly pointerId: number; readonly drag: DragGesture }
  | { readonly kind: 'rotate'; readonly pointerId: number; readonly rotate: RotateGesture; readonly centerX: number; readonly centerZ: number }

/**
 * Capture-phase pointer ownership. A primary press on furniture stops the event
 * before OrbitControls can start a camera gesture.
 */
export function FurnitureGestureController({
  placing,
  instances,
  onSelect,
  onMove,
  onRotate,
  onEmptyClick,
}: FurnitureGestureControllerProps) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const controls = useThree((state) => state.controls)
  const placingRef = useRef(placing)
  const instancesRef = useRef(instances)
  const selectRef = useRef(onSelect)
  const moveRef = useRef(onMove)
  const rotateRef = useRef(onRotate)
  const emptyClickRef = useRef(onEmptyClick)

  useEffect(() => {
    placingRef.current = placing
    instancesRef.current = instances
    selectRef.current = onSelect
    moveRef.current = onMove
    rotateRef.current = onRotate
    emptyClickRef.current = onEmptyClick
  })

  useEffect(() => {
    const element = gl.domElement
    const raycaster = new Raycaster()
    const pointer = new Vector2()
    let gesture: LiveGesture | null = null
    let emptyPress: { readonly pointerId: number; readonly x: number; readonly y: number } | null = null

    const restoreOrbit = () => {
      const orbit = controls as { enabled?: boolean } | null
      if (orbit && !placingRef.current) orbit.enabled = true
    }
    const lockOrbit = () => {
      const orbit = controls as { enabled?: boolean } | null
      if (orbit) orbit.enabled = false
    }
    const releaseCapture = (pointerId: number) => {
      try {
        if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
      } catch {
        // Already released.
      }
    }
    const floorHit = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return null
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const { origin, direction } = raycaster.ray
      return rayHitFloorY0(
        { x: origin.x, y: origin.y, z: origin.z },
        { x: direction.x, y: direction.y, z: direction.z },
      )
    }
    const aim = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return false
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      return true
    }
    const closestFurniture = (event: PointerEvent): { readonly part: 'rotate' | 'body'; readonly id: string } | null => {
      if (!aim(event)) return null
      const hits = raycaster.intersectObjects(scene.children, true)
      for (const hit of hits) {
        let object: Object3D | null = hit.object
        while (object) {
          const part = object.userData.furniturePart
          const furnitureId = object.userData.furnitureId
          if ((part === 'rotate' || part === 'body') && typeof furnitureId === 'string') {
            return { part, id: furnitureId }
          }
          object = object.parent
        }
      }
      return null
    }
    const finish = (pointerId: number | null) => {
      if (pointerId !== null) releaseCapture(pointerId)
      gesture = null
      restoreOrbit()
    }

    const onDown = (event: PointerEvent) => {
      if (placingRef.current) return
      if (event.button !== 0) return
      const furniture = closestFurniture(event)
      const claim = classifyPointerDown({
        button: event.button,
        placing: false,
        target: furniture?.part ?? 'empty',
      })
      if (claim !== 'drag' && claim !== 'rotate') {
        emptyPress = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
        return
      }
      const instance = instancesRef.current.find((item) => item.id === furniture?.id)
      const hit = floorHit(event)
      if (!instance || !hit || !furniture) return
      emptyPress = null
      event.preventDefault()
      event.stopImmediatePropagation()
      try {
        element.setPointerCapture(event.pointerId)
      } catch {
        // Capture is unavailable for some synthetic events. The canvas listeners still run.
      }
      lockOrbit()
      selectRef.current(instance.id)
      if (claim === 'rotate') {
        gesture = {
          kind: 'rotate',
          pointerId: event.pointerId,
          centerX: instance.position.x,
          centerZ: instance.position.z,
          rotate: beginRotate(instance.id, event.clientX, event.clientY, instance.rotationY, instance.position, hit),
        }
      } else {
        gesture = {
          kind: 'drag',
          pointerId: event.pointerId,
          drag: beginDrag(instance.id, event.clientX, event.clientY, instance.position, hit),
        }
      }
    }
    const onMove = (event: PointerEvent) => {
      if (!gesture || gesture.pointerId !== event.pointerId) return
      event.preventDefault()
      event.stopImmediatePropagation()
      lockOrbit()
      const hit = floorHit(event)
      if (gesture.kind === 'drag') {
        const next = advanceDrag(gesture.drag, event.clientX, event.clientY, hit)
        gesture = { ...gesture, drag: next }
        if (next.active && instancesRef.current.some((item) => item.id === next.id)) {
          moveRef.current(next.id, next.position.x, next.position.z)
        }
      } else {
        const current = gesture
        if (!instancesRef.current.some((item) => item.id === current.rotate.id)) {
          finish(event.pointerId)
          return
        }
        const next = advanceRotate(
          current.rotate,
          event.clientX,
          event.clientY,
          { x: current.centerX, z: current.centerZ },
          hit,
        )
        gesture = { kind: 'rotate', pointerId: current.pointerId, centerX: current.centerX, centerZ: current.centerZ, rotate: next }
        if (next.active) rotateRef.current(next.id, next.rotationY)
      }
    }
    const onUp = (event: PointerEvent) => {
      if (gesture && gesture.pointerId === event.pointerId) {
        event.preventDefault()
        event.stopImmediatePropagation()
        finish(event.pointerId)
        return
      }
      if (!emptyPress || emptyPress.pointerId !== event.pointerId) return
      const dragged = passedDragThreshold(emptyPress.x, emptyPress.y, event.clientX, event.clientY)
      emptyPress = null
      if (!dragged) emptyClickRef.current()
    }

    element.addEventListener('pointerdown', onDown, true)
    element.addEventListener('pointermove', onMove, true)
    element.addEventListener('pointerup', onUp, true)
    element.addEventListener('pointercancel', onUp, true)
    return () => {
      element.removeEventListener('pointerdown', onDown, true)
      element.removeEventListener('pointermove', onMove, true)
      element.removeEventListener('pointerup', onUp, true)
      element.removeEventListener('pointercancel', onUp, true)
      if (gesture) releaseCapture(gesture.pointerId)
      gesture = null
      restoreOrbit()
    }
  }, [camera, controls, gl, scene])

  return null
}
