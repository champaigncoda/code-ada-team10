interface ViewerToolbarProps {
  readonly showWalls: boolean
  readonly onToggleWalls: () => void
  readonly onResetCamera: () => void
  readonly onTopView: () => void
  readonly onReturnToEditor: () => void
}

export function ViewerToolbar({
  showWalls,
  onToggleWalls,
  onResetCamera,
  onTopView,
  onReturnToEditor,
}: ViewerToolbarProps) {
  return (
    <div className="viewer-toolbar">
      <div className="viewer-toolbar__actions">
        <button type="button" className="button button--secondary" onClick={onReturnToEditor}>
          Back to 2D editor
        </button>
      </div>
      <div className="viewer-toolbar__actions">
        <button
          type="button"
          className="button button--secondary"
          aria-pressed={showWalls}
          onClick={onToggleWalls}
        >
          {showWalls ? 'Hide Walls' : 'Show Walls'}
        </button>
        <button type="button" className="button button--secondary" onClick={onTopView}>
          Top View
        </button>
        <button type="button" className="button button--secondary" onClick={onResetCamera}>
          Reset Camera
        </button>
      </div>
    </div>
  )
}
