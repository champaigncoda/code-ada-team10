import { type ChangeEvent, useRef } from 'react'
import { ACCEPTED_FILE_INPUT_TYPES } from '../loadFloorPlanImage'

interface ImageFileButtonProps {
  readonly label: string
  readonly variant?: 'primary' | 'secondary'
  readonly onFileSelected: (file: File) => void
}

export function ImageFileButton({ label, variant = 'primary', onFileSelected }: ImageFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so choosing the same file again still fires a change event.
    event.target.value = ''
    if (file) onFileSelected(file)
  }

  return (
    <>
      <button type="button" className={`button button--${variant}`} onClick={() => inputRef.current?.click()}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_INPUT_TYPES}
        onChange={handleChange}
        hidden
        tabIndex={-1}
      />
    </>
  )
}
