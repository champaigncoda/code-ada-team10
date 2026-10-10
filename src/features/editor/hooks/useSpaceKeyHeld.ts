import { useEffect, useEffectEvent, useState } from 'react'

function isTextEntryTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

/**
 * Whether Space is currently held. While `shouldCapture` is true, Space is
 * swallowed so it neither scrolls the page nor re-activates a focused button
 * (e.g. Undo) when used for panning.
 */
export function useSpaceKeyHeld(shouldCapture: boolean): boolean {
  const [isHeld, setIsHeld] = useState(false)
  const getShouldCapture = useEffectEvent(() => shouldCapture)

  useEffect(() => {
    let isCapturing = false
    function handleKey(event: KeyboardEvent) {
      if (event.code !== 'Space' || isTextEntryTarget(event.target)) return
      const isKeyDown = event.type === 'keydown'
      if (isKeyDown && getShouldCapture()) {
        isCapturing = true
      }
      if (isCapturing) {
        event.preventDefault()
      }
      if (!isKeyDown) {
        isCapturing = false
      }
      setIsHeld(isKeyDown)
    }
    function release() {
      isCapturing = false
      setIsHeld(false)
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKey)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('keyup', handleKey)
      window.removeEventListener('blur', release)
    }
  }, [])

  return isHeld
}
