import { type DragEvent, useState } from 'react'
import { ImageFileButton } from './ImageFileButton'

interface UploadDropzoneProps {
  readonly onFileSelected: (file: File) => void
}

export function UploadDropzone({ onFileSelected }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }

  return (
    <section
      className={`upload-dropzone${isDragOver ? ' upload-dropzone--active' : ''}`}
      aria-label="Upload a floor plan"
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <p className="upload-dropzone__title">Upload a floor plan to get started</p>
      <p className="upload-dropzone__hint">Drag a PNG or JPG image here, or</p>
      <ImageFileButton label="Choose image" onFileSelected={onFileSelected} />
    </section>
  )
}
