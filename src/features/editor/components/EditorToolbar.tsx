import type { FloorPlanImage } from '../../../types/floorPlan'
import { ImageFileButton } from './ImageFileButton'

interface EditorToolbarProps {
  readonly image: FloorPlanImage
  readonly canUndo: boolean
  readonly canClear: boolean
  readonly onFileSelected: (file: File) => void
  readonly onUndo: () => void
  readonly onClear: () => void
  readonly onOpenFurniture?: () => void
}

export function EditorToolbar({
  image,
  canUndo,
  canClear,
  onFileSelected,
  onUndo,
  onClear,
  onOpenFurniture,
}: EditorToolbarProps) {
  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar__file">
        <span className="editor-toolbar__file-name" title={image.fileName}>
          {image.fileName}
        </span>
        <span className="editor-toolbar__file-size">
          {image.size.width} × {image.size.height} px
        </span>
      </div>
      <div className="editor-toolbar__actions">
        <button type="button" className="button button--secondary" onClick={onUndo} disabled={!canUndo}>
          Undo last point
        </button>
        <button type="button" className="button button--secondary" onClick={onClear} disabled={!canClear}>
          Clear polygon
        </button>
        <ImageFileButton label="Upload different image" variant="secondary" onFileSelected={onFileSelected} />
        {onOpenFurniture && (
          <button type="button" className="button button--secondary" onClick={onOpenFurniture}>
            Preview furniture
          </button>
        )}
      </div>
    </div>
  )
}
