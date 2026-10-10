import { type RefObject, useEffect, useState } from 'react'
import type { Size2D } from '../../../types/geometry'

/** Tracks an element's content-box size in CSS pixels; null until first measured. */
export function useElementSize(ref: RefObject<HTMLElement | null>): Size2D | null {
  const [size, setSize] = useState<Size2D | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize((previous) =>
        previous && previous.width === width && previous.height === height ? previous : { width, height },
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
